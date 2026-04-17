use axum::{extract::{Json, Path, Query}, http::StatusCode};
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use crate::analyzer::{self, AnalysisResult};
use crate::github::{DirEntry, GithubClient, parse_repo_input};

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
        files,
    }))
}

fn detect_language_simple(path: &str) -> String {
    match path.rsplit('.').next() {
        Some("cpp") | Some("cc") | Some("cxx") | Some("h") | Some("hpp") => "cpp".to_string(),
        Some("c") => "c".to_string(),
        Some("py") => "python".to_string(),
        _ => "unknown".to_string(),
    }
}
