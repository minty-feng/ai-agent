use std::fs;
use std::path::Path;
use serde::Serialize;
use crate::github::FileInfo;

const MAX_TREE_DEPTH: usize = 10;
const MAX_FILE_SIZE: u64 = 200_000;

/// Always-skip directories (never shown in tree or analyzed).
const ALWAYS_SKIP: &[&str] = &[".git", ".hg", ".svn"];

/// Suggested-skip directories: shown in tree but initialised unchecked on frontend.
pub const SUGGESTED_SKIP: &[&str] = &[
    "node_modules",
    "target",
    "dist",
    "build",
    "vendor",
    ".next",
    "coverage",
    "__pycache__",
    ".cache",
    ".idea",
    ".vscode",
    ".mypy_cache",
    ".pytest_cache",
];

#[derive(Debug, Serialize, Clone)]
pub struct LocalTreeEntry {
    pub name: String,
    /// Relative path from root, using '/' separators. Root entry has path "".
    pub path: String,
    pub is_dir: bool,
    /// Immediate children (empty for files).
    pub children: Vec<LocalTreeEntry>,
    /// Number of analysable source files under this entry (recursive).
    pub file_count: usize,
    /// Whether this directory is in the "suggested skip" list.
    pub suggested_skip: bool,
}

fn detect_language(name: &str) -> Option<&'static str> {
    let ext = name.rsplit('.').next()?;
    match ext {
        "js" | "jsx" => Some("javascript"),
        "ts" | "tsx" => Some("typescript"),
        "py" => Some("python"),
        "go" => Some("go"),
        "rs" => Some("rust"),
        "java" => Some("java"),
        "rb" => Some("ruby"),
        "php" => Some("php"),
        "vue" => Some("vue"),
        "svelte" => Some("svelte"),
        "cs" => Some("csharp"),
        "cpp" | "cc" | "cxx" | "c" | "h" | "hpp" => Some("cpp"),
        _ => None,
    }
}

/// Returns a language label for any file.  Known languages get their canonical
/// name; everything else gets the file extension (e.g. "xml", "bazel", "proto").
/// Files without any extension return "unknown".
fn language_label(name: &str) -> String {
    if let Some(lang) = detect_language(name) {
        return lang.to_string();
    }
    match name.rsplit('.').next() {
        Some(ext) if ext != name => ext.to_lowercase(),
        _ => "unknown".to_string(),
    }
}

/// Read the directory tree rooted at `root`.  Returns an error when the path
/// does not exist or is not a directory.
pub fn read_local_tree(root: &Path) -> anyhow::Result<LocalTreeEntry> {
    if !root.exists() {
        anyhow::bail!("Path does not exist: {}", root.display());
    }
    if !root.is_dir() {
        anyhow::bail!("Path is not a directory: {}", root.display());
    }
    let entry = build_tree(root, "", 0);
    Ok(entry)
}

fn build_tree(dir: &Path, rel_path: &str, depth: usize) -> LocalTreeEntry {
    let name = dir
        .file_name()
        .map(|n| n.to_string_lossy().into_owned())
        .unwrap_or_else(|| dir.to_string_lossy().into_owned());

    let mut children: Vec<LocalTreeEntry> = Vec::new();
    let mut file_count: usize = 0;

    if depth < MAX_TREE_DEPTH {
        let mut raw_entries: Vec<_> = fs::read_dir(dir)
            .map(|rd| rd.filter_map(|e| e.ok()).collect())
            .unwrap_or_default();
        raw_entries.sort_by_key(|e| e.file_name());

        for entry in raw_entries {
            let child_fs = entry.path();
            let child_name = entry.file_name().to_string_lossy().into_owned();
            let child_rel = if rel_path.is_empty() {
                child_name.clone()
            } else {
                format!("{}/{}", rel_path, child_name)
            };

            if child_fs.is_dir() {
                if ALWAYS_SKIP.contains(&child_name.as_str()) {
                    continue;
                }
                let suggested = SUGGESTED_SKIP.contains(&child_name.as_str());
                let child_entry = build_tree(&child_fs, &child_rel, depth + 1);
                // Propagate file_count even for suggested-skip dirs so the
                // frontend can show them accurately.
                file_count += child_entry.file_count;
                children.push(LocalTreeEntry {
                    suggested_skip: suggested,
                    ..child_entry
                });
            } else if child_fs.is_file() {
                file_count += 1;
                // Files are included as leaf nodes (not checkable, just visible).
                children.push(LocalTreeEntry {
                    name: child_name,
                    path: child_rel,
                    is_dir: false,
                    children: vec![],
                    file_count: 1,
                    suggested_skip: false,
                });
            }
        }
    }

    let suggested_skip = SUGGESTED_SKIP.contains(&name.as_str());

    LocalTreeEntry {
        name,
        path: rel_path.to_string(),
        is_dir: true,
        children,
        file_count,
        suggested_skip,
    }
}

// ---------------------------------------------------------------------------
// File collection for analysis
// ---------------------------------------------------------------------------

/// Collect source files from `root` according to the supplied rules:
///
/// - `include_paths` – relative paths to include.  If empty, everything from
///   root is considered.
/// - `exclude_paths` – relative paths that are always excluded (override
///   `include_paths`).
/// - `exclude_extensions` – file extensions (without leading dot) that are
///   always excluded.
pub fn collect_local_files(
    root: &Path,
    include_paths: &[String],
    exclude_paths: &[String],
    exclude_extensions: &[String],
) -> Vec<FileInfo> {
    let norm_excl_paths: Vec<String> = exclude_paths
        .iter()
        .map(|p| p.trim_matches('/').to_string())
        .collect();

    let norm_excl_exts: Vec<String> = exclude_extensions
        .iter()
        .map(|e| e.trim_start_matches('.').to_lowercase())
        .collect();

    let mut files: Vec<FileInfo> = Vec::new();

    if include_paths.is_empty() {
        collect_recursive(root, "", &norm_excl_paths, &norm_excl_exts, &mut files);
    } else {
        for inc in include_paths {
            let rel = inc.trim_matches('/');
            let full = root.join(rel);
            if full.is_dir() {
                collect_recursive(&full, rel, &norm_excl_paths, &norm_excl_exts, &mut files);
            } else if full.is_file() {
                if let Some(info) =
                    try_read_file(&full, rel, &norm_excl_paths, &norm_excl_exts)
                {
                    files.push(info);
                }
            }
        }
    }

    files
}

fn path_is_excluded(rel_path: &str, exclude_paths: &[String]) -> bool {
    let rel = rel_path.trim_matches('/');
    exclude_paths.iter().any(|ex| {
        let ex = ex.trim_matches('/');
        rel == ex || rel.starts_with(&format!("{}/", ex))
    })
}

fn collect_recursive(
    dir: &Path,
    rel_path: &str,
    exclude_paths: &[String],
    exclude_exts: &[String],
    files: &mut Vec<FileInfo>,
) {
    let raw_entries: Vec<_> = fs::read_dir(dir)
        .map(|rd| rd.filter_map(|e| e.ok()).collect())
        .unwrap_or_default();

    for entry in raw_entries {
        let child_fs = entry.path();
        let child_name = entry.file_name().to_string_lossy().into_owned();
        let child_rel = if rel_path.is_empty() {
            child_name.clone()
        } else {
            format!("{}/{}", rel_path, child_name)
        };

        if path_is_excluded(&child_rel, exclude_paths) {
            continue;
        }

        if child_fs.is_dir() {
            if ALWAYS_SKIP.contains(&child_name.as_str()) {
                continue;
            }
            collect_recursive(&child_fs, &child_rel, exclude_paths, exclude_exts, files);
        } else if child_fs.is_file() {
            if let Some(info) = try_read_file(&child_fs, &child_rel, exclude_paths, exclude_exts) {
                files.push(info);
            }
        }
    }
}

fn try_read_file(
    path: &Path,
    rel_path: &str,
    _exclude_paths: &[String],
    exclude_exts: &[String],
) -> Option<FileInfo> {
    let name = path.file_name()?.to_string_lossy().into_owned();

    let ext = name.rsplit('.').next().map(|e| e.to_lowercase());
    if let Some(ref ext) = ext {
        if ext != &name.to_lowercase() && exclude_exts.contains(ext) {
            return None;
        }
    }

    let lang = language_label(&name);

    let metadata = fs::metadata(path).ok()?;
    if metadata.len() > MAX_FILE_SIZE {
        return None;
    }

    // read_to_string naturally skips binary files (invalid UTF-8 → None).
    let content = fs::read_to_string(path).ok()?;

    Some(FileInfo {
        path: rel_path.replace('\\', "/"),
        content,
        size: metadata.len() as usize,
        language: lang,
    })
}
