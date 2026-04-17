use axum::{extract::{Json, Path, Query}, http::StatusCode};
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use crate::analyzer::{self, AnalysisResult};
use crate::github::{CommitInfo, DirEntry, GithubClient, parse_repo_input};

#[derive(Deserialize)]
pub struct AnalyzeRequest {
    pub repo: String,
    pub token: Option<String>,
}

#[derive(Serialize)]
pub struct ErrorResponse {
    pub error: String,
}

pub async fn analyze_repo(
    Json(req): Json<AnalyzeRequest>,
) -> Result<Json<AnalysisResult>, (StatusCode, Json<ErrorResponse>)> {
    let (owner, repo) = parse_repo_input(&req.repo).map_err(|e| {
        (
            StatusCode::BAD_REQUEST,
            Json(ErrorResponse { error: e.to_string() }),
        )
    })?;

    let client = GithubClient::new(req.token);

    let files = client.fetch_file_tree(&owner, &repo).await.map_err(|e| {
        (
            StatusCode::BAD_GATEWAY,
            Json(ErrorResponse { error: e.to_string() }),
        )
    })?;

    if files.is_empty() {
        return Err((
            StatusCode::NOT_FOUND,
            Json(ErrorResponse {
                error: "No supported source files found in this repository.".to_string(),
            }),
        ));
    }

    let result = analyzer::analyze(files);
    Ok(Json(result))
}

// ---------------------------------------------------------------------------
// GET /api/tree/:owner/:repo?path=&token=
// ---------------------------------------------------------------------------

#[derive(Deserialize)]
pub struct TreeQuery {
    pub path: Option<String>,
    pub token: Option<String>,
}

pub async fn get_tree(
    Path((owner, repo)): Path<(String, String)>,
    Query(params): Query<TreeQuery>,
) -> Result<Json<Vec<DirEntry>>, (StatusCode, Json<ErrorResponse>)> {
    let path = params.path.unwrap_or_default();
    let client = GithubClient::new(params.token);

    let entries = client
        .fetch_directory(&owner, &repo, &path)
        .await
        .map_err(|e| {
            (
                StatusCode::BAD_GATEWAY,
                Json(ErrorResponse { error: e.to_string() }),
            )
        })?;

    Ok(Json(entries))
}

// ---------------------------------------------------------------------------
// GET /api/file/:owner/:repo?path=&token=
// ---------------------------------------------------------------------------

#[derive(Deserialize)]
pub struct FileQuery {
    pub path: Option<String>,
    pub token: Option<String>,
}

#[derive(Serialize)]
pub struct FileContentResponse {
    pub path: String,
    pub content: String,
}

pub async fn get_file(
    Path((owner, repo)): Path<(String, String)>,
    Query(params): Query<FileQuery>,
) -> Result<Json<FileContentResponse>, (StatusCode, Json<ErrorResponse>)> {
    let path = params.path.unwrap_or_default();
    let client = GithubClient::new(params.token);

    let content = client
        .fetch_file_content_pub(&owner, &repo, &path)
        .await
        .map_err(|e| {
            (
                StatusCode::BAD_GATEWAY,
                Json(ErrorResponse { error: e.to_string() }),
            )
        })?;

    Ok(Json(FileContentResponse { path, content }))
}

// ---------------------------------------------------------------------------
// POST /api/build-deps
// ---------------------------------------------------------------------------

#[derive(Deserialize)]
pub struct BuildDepsRequest {
    pub repo: String,
    pub token: Option<String>,
    pub file_path: String,
    pub target: Option<String>,
}

#[derive(Serialize)]
pub struct SourceFileInfo {
    pub path: String,
    pub last_modified: Option<String>,
    pub language: String,
}

#[derive(Serialize)]
pub struct BuildDepsResponse {
    pub targets: Vec<String>,
    /// Subset of `targets` that are GTest / test targets.
    pub test_targets: Vec<String>,
    pub files: Vec<SourceFileInfo>,
}

pub async fn get_build_deps(
    Json(req): Json<BuildDepsRequest>,
) -> Result<Json<BuildDepsResponse>, (StatusCode, Json<ErrorResponse>)> {
    let (owner, repo_name) = parse_repo_input(&req.repo).map_err(|e| {
        (
            StatusCode::BAD_REQUEST,
            Json(ErrorResponse { error: e.to_string() }),
        )
    })?;

    let client = GithubClient::new(req.token.clone());

    // Fetch build file content
    let content = client
        .fetch_file_content_pub(&owner, &repo_name, &req.file_path)
        .await
        .map_err(|e| {
            (
                StatusCode::BAD_GATEWAY,
                Json(ErrorResponse { error: e.to_string() }),
            )
        })?;

    // Determine directory containing the build file
    let base_dir = req
        .file_path
        .rsplitn(2, '/')
        .nth(1)
        .unwrap_or("")
        .to_string();

    // Parse targets
    let file_name = req.file_path.split('/').last().unwrap_or("");
    let parsed_targets = if file_name.to_lowercase() == "cmakelists.txt" {
        crate::build_parser::parse_cmake(&content, &base_dir)
    } else {
        crate::build_parser::parse_bazel(&content, &base_dir)
    };

    let all_target_names: Vec<String> = parsed_targets.iter().map(|t| t.name.clone()).collect();
    let test_target_names: Vec<String> = parsed_targets
        .iter()
        .filter(|t| t.is_test)
        .map(|t| t.name.clone())
        .collect();

    // Collect source files for the requested target (or all targets)
    let source_files: Vec<String> = if let Some(ref target_name) = req.target {
        parsed_targets
            .iter()
            .filter(|t| &t.name == target_name)
            .flat_map(|t| t.sources.clone())
            .collect()
    } else {
        parsed_targets.into_iter().flat_map(|t| t.sources).collect()
    };

    // Deduplicate while preserving order
    let mut seen = std::collections::HashSet::new();
    let source_files: Vec<String> = source_files
        .into_iter()
        .filter(|s| seen.insert(s.clone()))
        .collect();

    // Fetch last-commit times concurrently
    let client = Arc::new(client);
    let owner = Arc::new(owner);
    let repo_name = Arc::new(repo_name);

    let mut handles = Vec::new();
    for path in source_files {
        let client = client.clone();
        let owner = owner.clone();
        let repo_name = repo_name.clone();
        handles.push(tokio::spawn(async move {
            let last_modified = client
                .fetch_last_commit_time(&owner, &repo_name, &path)
                .await
                .ok()
                .flatten();
            let language = detect_language_simple(&path);
            SourceFileInfo { path, last_modified, language }
        }));
    }

    let mut files = Vec::new();
    for handle in handles {
        if let Ok(info) = handle.await {
            files.push(info);
        }
    }

    // Sort newest-first (ISO-8601 strings sort lexicographically)
    files.sort_by(|a, b| b.last_modified.cmp(&a.last_modified));

    Ok(Json(BuildDepsResponse {
        targets: all_target_names,
        test_targets: test_target_names,
        files,
    }))
}

// ---------------------------------------------------------------------------
// POST /api/local/tree
// ---------------------------------------------------------------------------

#[derive(Deserialize)]
pub struct LocalTreeRequest {
    pub path: String,
}

pub async fn local_tree(
    Json(req): Json<LocalTreeRequest>,
) -> Result<Json<crate::local::LocalTreeEntry>, (StatusCode, Json<ErrorResponse>)> {
    let path = std::path::Path::new(&req.path);
    crate::local::read_local_tree(path)
        .map(Json)
        .map_err(|e| {
            (
                StatusCode::BAD_REQUEST,
                Json(ErrorResponse { error: e.to_string() }),
            )
        })
}

// ---------------------------------------------------------------------------
// POST /api/local/analyze
// ---------------------------------------------------------------------------

#[derive(Deserialize)]
pub struct LocalAnalyzeRequest {
    /// Absolute path to the root directory of the local repository.
    pub path: String,
    /// Relative directory paths to include.  Empty = include everything.
    pub include_paths: Vec<String>,
    /// Relative paths (dirs or files) to always exclude.
    pub exclude_paths: Vec<String>,
    /// File extensions to exclude (without leading dot, e.g. "json").
    pub exclude_extensions: Vec<String>,
}

pub async fn local_analyze(
    Json(req): Json<LocalAnalyzeRequest>,
) -> Result<Json<AnalysisResult>, (StatusCode, Json<ErrorResponse>)> {
    let root = std::path::Path::new(&req.path);

    if !root.exists() || !root.is_dir() {
        return Err((
            StatusCode::BAD_REQUEST,
            Json(ErrorResponse {
                error: format!(
                    "Path '{}' is not a valid directory",
                    req.path
                ),
            }),
        ));
    }

    let files = crate::local::collect_local_files(
        root,
        &req.include_paths,
        &req.exclude_paths,
        &req.exclude_extensions,
    );

    if files.is_empty() {
        return Err((
            StatusCode::NOT_FOUND,
            Json(ErrorResponse {
                error:
                    "No supported source files found with the current selection."
                        .to_string(),
            }),
        ));
    }

    let result = crate::analyzer::analyze(files);
    Ok(Json(result))
}

// ---------------------------------------------------------------------------
// POST /api/local/analyze-files
// ---------------------------------------------------------------------------

/// A single file with its content, sent from the browser (File System Access API).
#[derive(Deserialize)]
pub struct FilePayload {
    pub path: String,
    pub content: String,
    pub size: usize,
    pub language: String,
}

#[derive(Deserialize)]
pub struct AnalyzeFilesRequest {
    pub files: Vec<FilePayload>,
}

/// Accepts pre-read file contents from the browser (used when the frontend
/// opens a folder via `showDirectoryPicker` and reads files client-side).
pub async fn analyze_files(
    Json(req): Json<AnalyzeFilesRequest>,
) -> Result<Json<AnalysisResult>, (StatusCode, Json<ErrorResponse>)> {
    if req.files.is_empty() {
        return Err((
            StatusCode::BAD_REQUEST,
            Json(ErrorResponse {
                error: "No files provided for analysis.".to_string(),
            }),
        ));
    }

    let files: Vec<crate::github::FileInfo> = req
        .files
        .into_iter()
        .map(|f| crate::github::FileInfo {
            path: f.path,
            content: f.content,
            size: f.size,
            language: f.language,
        })
        .collect();

    let result = crate::analyzer::analyze(files);
    Ok(Json(result))
}

fn detect_language_simple(path: &str) -> String {
    match path.rsplit('.').next() {
        Some("cpp") | Some("cc") | Some("cxx") | Some("h") | Some("hpp") => "cpp".to_string(),
        Some("c") => "c".to_string(),
        Some("py") => "python".to_string(),
        _ => "unknown".to_string(),
    }
}

// ---------------------------------------------------------------------------
// POST /api/local/build-deps
// ---------------------------------------------------------------------------

#[derive(Deserialize)]
pub struct LocalBuildDepsRequest {
    /// Absolute path to the repository root.
    pub root_path: String,
    /// Relative path to the build file (e.g. "src/BUILD.bazel").
    pub file_path: String,
    /// Optional target name to filter sources.
    pub target: Option<String>,
    /// Optional file content (used when the backend cannot access the FS,
    /// e.g. when the frontend reads via showDirectoryPicker).
    pub file_content: Option<String>,
}

pub async fn local_build_deps(
    Json(req): Json<LocalBuildDepsRequest>,
) -> Result<Json<BuildDepsResponse>, (StatusCode, Json<ErrorResponse>)> {
    let root = std::path::Path::new(&req.root_path);

    let content = if let Some(fc) = req.file_content {
        fc
    } else {
        let full_path = root.join(&req.file_path);
        std::fs::read_to_string(&full_path).map_err(|e| {
            (
                StatusCode::BAD_REQUEST,
                Json(ErrorResponse {
                    error: format!("Cannot read file '{}': {}", full_path.display(), e),
                }),
            )
        })?
    };

    let base_dir = req
        .file_path
        .rsplitn(2, '/')
        .nth(1)
        .unwrap_or("")
        .to_string();

    let file_name = req.file_path.split('/').last().unwrap_or("");
    let parsed_targets = if file_name.to_lowercase() == "cmakelists.txt" {
        crate::build_parser::parse_cmake(&content, &base_dir)
    } else {
        crate::build_parser::parse_bazel(&content, &base_dir)
    };

    let all_target_names: Vec<String> = parsed_targets.iter().map(|t| t.name.clone()).collect();
    let test_target_names: Vec<String> = parsed_targets
        .iter()
        .filter(|t| t.is_test)
        .map(|t| t.name.clone())
        .collect();

    let source_files: Vec<String> = if let Some(ref target_name) = req.target {
        parsed_targets
            .iter()
            .filter(|t| &t.name == target_name)
            .flat_map(|t| t.sources.clone())
            .collect()
    } else {
        parsed_targets.into_iter().flat_map(|t| t.sources).collect()
    };

    let mut seen = std::collections::HashSet::new();
    let source_files: Vec<String> = source_files
        .into_iter()
        .filter(|s| seen.insert(s.clone()))
        .collect();

    // For local files, read last-modified timestamp from filesystem
    let mut files = Vec::new();
    for path in source_files {
        let full = root.join(&path);
        let last_modified = std::fs::metadata(&full)
            .ok()
            .and_then(|m| m.modified().ok())
            .map(|t| {
                let datetime: chrono::DateTime<chrono::Utc> = t.into();
                datetime.to_rfc3339()
            });
        let language = detect_language_simple(&path);
        files.push(SourceFileInfo {
            path,
            last_modified,
            language,
        });
    }

    files.sort_by(|a, b| b.last_modified.cmp(&a.last_modified));

    Ok(Json(BuildDepsResponse {
        targets: all_target_names,
        test_targets: test_target_names,
        files,
    }))
}

// ---------------------------------------------------------------------------
// POST /api/local/gtest-analyze
// ---------------------------------------------------------------------------

#[derive(Deserialize)]
pub struct LocalGtestAnalyzeRequest {
    /// Absolute path to the repository root.
    pub root_path: String,
    /// Relative path to the BUILD file.
    pub build_file_path: String,
    /// Name of the GTest target to analyze.
    pub target: String,
    /// Optional file content (used when the backend cannot access the FS).
    pub file_content: Option<String>,
}

pub async fn local_gtest_analyze(
    Json(req): Json<LocalGtestAnalyzeRequest>,
) -> Result<Json<GtestAnalyzeResponse>, (StatusCode, Json<ErrorResponse>)> {
    let root = std::path::Path::new(&req.root_path);

    let content = if let Some(fc) = req.file_content {
        fc
    } else {
        let full_path = root.join(&req.build_file_path);
        std::fs::read_to_string(&full_path).map_err(|e| {
            (
                StatusCode::BAD_REQUEST,
                Json(ErrorResponse {
                    error: format!("Cannot read file '{}': {}", full_path.display(), e),
                }),
            )
        })?
    };

    let base_dir = req
        .build_file_path
        .rsplitn(2, '/')
        .nth(1)
        .unwrap_or("")
        .to_string();

    let file_name = req.build_file_path.split('/').last().unwrap_or("");
    let parsed_targets = if file_name.to_lowercase() == "cmakelists.txt" {
        crate::build_parser::parse_cmake(&content, &base_dir)
    } else {
        crate::build_parser::parse_bazel(&content, &base_dir)
    };

    let target = parsed_targets
        .into_iter()
        .find(|t| t.name == req.target)
        .ok_or_else(|| {
            (
                StatusCode::NOT_FOUND,
                Json(ErrorResponse {
                    error: format!("Target '{}' not found in build file", req.target),
                }),
            )
        })?;

    let mut seen = std::collections::HashSet::new();
    let source_files: Vec<String> = target
        .sources
        .into_iter()
        .filter(|s| seen.insert(s.clone()))
        .collect();

    let basename_to_path: std::collections::HashMap<String, String> = source_files
        .iter()
        .map(|p| {
            let base = p.split('/').last().unwrap_or(p.as_str()).to_string();
            (base, p.clone())
        })
        .collect();

    let mut files: Vec<GtestFileAnalysis> = Vec::new();
    for path in &source_files {
        let full = root.join(path);
        let language = detect_language_simple(path);

        let file_content = std::fs::read_to_string(&full).unwrap_or_default();
        let includes = crate::build_parser::parse_includes(&file_content);

        // Get last modified time as a stand-in for commit info
        let last_modified = std::fs::metadata(&full)
            .ok()
            .and_then(|m| m.modified().ok())
            .map(|t| {
                let datetime: chrono::DateTime<chrono::Utc> = t.into();
                datetime.to_rfc3339()
            });

        let commits = if let Some(date) = last_modified {
            vec![CommitInfo {
                sha: "(local)".to_string(),
                message: "Last modified on disk".to_string(),
                author: "local".to_string(),
                date,
            }]
        } else {
            vec![]
        };

        files.push(GtestFileAnalysis {
            path: path.clone(),
            language,
            commits,
            includes,
        });
    }

    files.sort_by(|a, b| {
        let a_date = a.commits.first().map(|c| c.date.as_str()).unwrap_or("");
        let b_date = b.commits.first().map(|c| c.date.as_str()).unwrap_or("");
        b_date.cmp(a_date)
    });

    let mut dep_edges: Vec<DepEdge> = Vec::new();
    for file in &files {
        for include in &file.includes {
            let include_base = include.split('/').last().unwrap_or(include.as_str());
            if let Some(target_path) = basename_to_path.get(include_base) {
                if target_path != &file.path {
                    dep_edges.push(DepEdge {
                        from: file.path.clone(),
                        to: target_path.clone(),
                    });
                }
            } else {
                // Search upward from the BUILD directory for the include
                if let Some(found) =
                    crate::build_parser::find_include_upward(root, &base_dir, include)
                {
                    if found != file.path {
                        dep_edges.push(DepEdge {
                            from: file.path.clone(),
                            to: found,
                        });
                    }
                }
            }
        }
    }

    Ok(Json(GtestAnalyzeResponse {
        target: req.target,
        files,
        dep_edges,
    }))
}
// POST /api/gtest-analyze
// ---------------------------------------------------------------------------

#[derive(Deserialize)]
pub struct GtestAnalyzeRequest {
    pub repo: String,
    pub token: Option<String>,
    /// Path to the CMakeLists.txt or BUILD file inside the repo.
    pub build_file_path: String,
    /// Name of the GTest target to analyze.
    pub target: String,
}

#[derive(Serialize, Clone)]
pub struct GtestFileAnalysis {
    pub path: String,
    pub language: String,
    /// Last N commits that touched this file.
    pub commits: Vec<CommitInfo>,
    /// Raw `#include` paths found in the file (C/C++) or imports (Python).
    pub includes: Vec<String>,
}

#[derive(Serialize)]
pub struct DepEdge {
    pub from: String,
    pub to: String,
}

#[derive(Serialize)]
pub struct GtestAnalyzeResponse {
    pub target: String,
    pub files: Vec<GtestFileAnalysis>,
    /// Edges between source files in the target based on include/import analysis.
    pub dep_edges: Vec<DepEdge>,
}

pub async fn gtest_analyze(
    Json(req): Json<GtestAnalyzeRequest>,
) -> Result<Json<GtestAnalyzeResponse>, (StatusCode, Json<ErrorResponse>)> {
    let (owner, repo_name) = parse_repo_input(&req.repo).map_err(|e| {
        (
            StatusCode::BAD_REQUEST,
            Json(ErrorResponse { error: e.to_string() }),
        )
    })?;

    let client = GithubClient::new(req.token.clone());

    // Fetch the build file
    let content = client
        .fetch_file_content_pub(&owner, &repo_name, &req.build_file_path)
        .await
        .map_err(|e| {
            (
                StatusCode::BAD_GATEWAY,
                Json(ErrorResponse { error: e.to_string() }),
            )
        })?;

    let base_dir = req
        .build_file_path
        .rsplitn(2, '/')
        .nth(1)
        .unwrap_or("")
        .to_string();

    let file_name = req.build_file_path.split('/').last().unwrap_or("");
    let parsed_targets = if file_name.to_lowercase() == "cmakelists.txt" {
        crate::build_parser::parse_cmake(&content, &base_dir)
    } else {
        crate::build_parser::parse_bazel(&content, &base_dir)
    };

    // Find the requested target
    let target = parsed_targets
        .into_iter()
        .find(|t| t.name == req.target)
        .ok_or_else(|| {
            (
                StatusCode::NOT_FOUND,
                Json(ErrorResponse {
                    error: format!("Target '{}' not found in build file", req.target),
                }),
            )
        })?;

    // Deduplicate source files
    let mut seen = std::collections::HashSet::new();
    let source_files: Vec<String> = target
        .sources
        .into_iter()
        .filter(|s| seen.insert(s.clone()))
        .collect();

    // Build a set of basenames for dep-edge detection
    let basename_to_path: std::collections::HashMap<String, String> = source_files
        .iter()
        .map(|p| {
            let base = p.split('/').last().unwrap_or(p.as_str()).to_string();
            (base, p.clone())
        })
        .collect();

    // Fetch content + commits for every source file concurrently
    let client = Arc::new(client);
    let owner = Arc::new(owner);
    let repo_name = Arc::new(repo_name);

    let mut handles = Vec::new();
    for path in source_files {
        let client = client.clone();
        let owner = owner.clone();
        let repo_name = repo_name.clone();
        handles.push(tokio::spawn(async move {
            let language = detect_language_simple(&path);

            let (file_content, commits) = tokio::join!(
                client.fetch_file_content_pub(&owner, &repo_name, &path),
                client.fetch_commits(&owner, &repo_name, &path, 10),
            );

            let includes = match &file_content {
                Ok(c) => crate::build_parser::parse_includes(c),
                Err(_) => vec![],
            };

            let commits = commits.unwrap_or_default();

            GtestFileAnalysis { path, language, commits, includes }
        }));
    }

    let mut files: Vec<GtestFileAnalysis> = Vec::new();
    for handle in handles {
        if let Ok(info) = handle.await {
            files.push(info);
        }
    }

    // Sort by most-recently-committed first
    files.sort_by(|a, b| {
        let a_date = a.commits.first().map(|c| c.date.as_str()).unwrap_or("");
        let b_date = b.commits.first().map(|c| c.date.as_str()).unwrap_or("");
        b_date.cmp(a_date)
    });

    // Build dep edges: an edge from file A to file B if A includes a file whose
    // basename matches B's basename (and A != B).
    let mut dep_edges: Vec<DepEdge> = Vec::new();
    for file in &files {
        for include in &file.includes {
            let include_base = include.split('/').last().unwrap_or(include.as_str());
            if let Some(target_path) = basename_to_path.get(include_base) {
                if target_path != &file.path {
                    dep_edges.push(DepEdge {
                        from: file.path.clone(),
                        to: target_path.clone(),
                    });
                }
            }
        }
    }

    Ok(Json(GtestAnalyzeResponse {
        target: req.target,
        files,
        dep_edges,
    }))
}
