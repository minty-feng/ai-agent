use anyhow::{anyhow, Result};
use base64::{engine::general_purpose, Engine as _};
use reqwest::Client;
use serde::{Deserialize, Serialize};

/// A single entry in a repository directory listing.
#[derive(Debug, Clone, Serialize)]
pub struct DirEntry {
    pub name: String,
    pub path: String,
    pub entry_type: String, // "file" | "dir"
    pub size: Option<usize>,
}

#[derive(Debug, Clone)]
pub struct FileInfo {
    pub path: String,
    pub content: String,
    pub size: usize,
    pub language: String,
}

#[derive(Deserialize)]
struct TreeResponse {
    tree: Vec<TreeItem>,
    truncated: Option<bool>,
}

#[derive(Deserialize)]
struct TreeItem {
    path: Option<String>,
    #[serde(rename = "type")]
    item_type: Option<String>,
    size: Option<usize>,
}

#[derive(Deserialize)]
struct ContentResponse {
    content: Option<String>,
    encoding: Option<String>,
}

/// A single item returned by the GitHub Contents API (directory listing).
#[derive(Deserialize)]
struct ContentsItem {
    name: String,
    path: String,
    #[serde(rename = "type")]
    item_type: String, // "file", "dir", "symlink", "submodule"
    size: Option<usize>,
}

/// Top-level item in a commits list response.
#[derive(Deserialize)]
struct CommitListItem {
    sha: String,
    commit: CommitData,
}

#[derive(Deserialize)]
struct CommitData {
    message: String,
    author: CommitPersonData,
    committer: CommitPersonData,
}

#[derive(Deserialize)]
struct CommitPersonData {
    #[serde(default)]
    name: String,
    date: String,
}

#[derive(Deserialize)]
struct RepoInfo {
    default_branch: String,
}

/// A single commit summary for public API use.
#[derive(Debug, Clone, Serialize)]
pub struct CommitInfo {
    pub sha: String,
    pub message: String,
    pub author: String,
    pub date: String,
}

fn detect_language(path: &str) -> Option<&'static str> {
    let ext = path.split('.').last()?;
    match ext {
        "js" => Some("javascript"),
        "jsx" => Some("javascript"),
        "ts" => Some("typescript"),
        "tsx" => Some("typescript"),
        "py" => Some("python"),
        "go" => Some("go"),
        "rs" => Some("rust"),
        "java" => Some("java"),
        "rb" => Some("ruby"),
        "php" => Some("php"),
        "vue" => Some("vue"),
        "svelte" => Some("svelte"),
        "cs" => Some("csharp"),
        "cpp" | "cc" | "cxx" => Some("cpp"),
        "c" => Some("c"),
        "h" | "hpp" => Some("cpp"),
        _ => None,
    }
}

/// Returns a language label for any file.  Known languages get their canonical
/// name; everything else gets the file extension (e.g. "xml", "bazel", "proto").
fn language_label(path: &str) -> String {
    if let Some(lang) = detect_language(path) {
        return lang.to_string();
    }
    // Use just the filename portion so paths like "src/Makefile" aren't
    // misinterpreted as having an extension.
    let name = path.rsplit('/').next().unwrap_or(path);
    match name.rsplit('.').next() {
        Some(ext) if ext != name => ext.to_lowercase(),
        _ => "unknown".to_string(),
    }
}

fn should_skip(path: &str) -> bool {
    let skip_dirs = [
        "node_modules/",
        ".git/",
        "dist/",
        "build/",
        "vendor/",
        "target/",
        ".next/",
        "coverage/",
        "__pycache__/",
        ".cache/",
    ];
    skip_dirs.iter().any(|d| path.contains(d))
}

#[derive(Clone)]
pub struct GithubClient {
    client: Client,
    token: Option<String>,
}

impl GithubClient {
    pub fn new(token: Option<String>) -> Self {
        Self {
            client: Client::new(),
            token,
        }
    }

    fn auth_header(&self) -> Option<String> {
        self.token.as_ref().map(|t| format!("Bearer {}", t))
    }

    async fn get_json<T: for<'de> Deserialize<'de>>(&self, url: &str) -> Result<T> {
        let mut req = self.client.get(url).header("User-Agent", "codeflow/0.1");
        if let Some(auth) = self.auth_header() {
            req = req.header("Authorization", auth);
        }
        let resp = req.send().await?;
        if !resp.status().is_success() {
            let status = resp.status();
            let body = resp.text().await.unwrap_or_default();
            return Err(anyhow!("GitHub API error {}: {}", status, body));
        }
        Ok(resp.json().await?)
    }

    pub async fn get_default_branch(&self, owner: &str, repo: &str) -> Result<String> {
        let url = format!("https://api.github.com/repos/{}/{}", owner, repo);
        let info: RepoInfo = self.get_json(&url).await?;
        Ok(info.default_branch)
    }

    pub async fn fetch_file_tree(&self, owner: &str, repo: &str) -> Result<Vec<FileInfo>> {
        let branch = self.get_default_branch(owner, repo).await?;
        let url = format!(
            "https://api.github.com/repos/{}/{}/git/trees/{}?recursive=1",
            owner, repo, branch
        );
        let tree: TreeResponse = self.get_json(&url).await?;

        let files: Vec<(String, usize)> = tree
            .tree
            .into_iter()
            .filter_map(|item| {
                let path = item.path?;
                let item_type = item.item_type?;
                if item_type != "blob" {
                    return None;
                }
                if should_skip(&path) {
                    return None;
                }
                let size = item.size.unwrap_or(0);
                // Skip very large files (>200KB)
                if size > 200_000 {
                    return None;
                }
                Some((path, size))
            })
            .collect();

        let mut result = Vec::new();
        for (path, size) in files {
            match self.fetch_file_content(owner, repo, &path).await {
                Ok(content) => {
                    let language = language_label(&path);
                    result.push(FileInfo {
                        path,
                        content,
                        size,
                        language,
                    });
                }
                Err(e) => {
                    tracing::warn!("Failed to fetch {}: {}", path, e);
                }
            }
        }

        Ok(result)
    }

    async fn fetch_file_content(&self, owner: &str, repo: &str, path: &str) -> Result<String> {
        self.fetch_file_content_pub(owner, repo, path).await
    }

    /// Returns a shallow one-level directory listing using the GitHub Contents API.
    pub async fn fetch_directory(&self, owner: &str, repo: &str, path: &str) -> Result<Vec<DirEntry>> {
        let url = if path.is_empty() {
            format!("https://api.github.com/repos/{}/{}/contents", owner, repo)
        } else {
            format!(
                "https://api.github.com/repos/{}/{}/contents/{}",
                owner, repo, path
            )
        };
        let items: Vec<ContentsItem> = self.get_json(&url).await?;
        let entries = items
            .into_iter()
            .map(|item| DirEntry {
                name: item.name,
                path: item.path,
                entry_type: if item.item_type == "dir" {
                    "dir".to_string()
                } else {
                    "file".to_string()
                },
                size: item.size,
            })
            .collect();
        Ok(entries)
    }

    /// Returns the ISO-8601 date string of the most recent commit that touched `path`.
    pub async fn fetch_last_commit_time(
        &self,
        owner: &str,
        repo: &str,
        path: &str,
    ) -> Result<Option<String>> {
        let url = format!(
            "https://api.github.com/repos/{}/{}/commits?path={}&per_page=1",
            owner, repo, path
        );
        let commits: Vec<CommitListItem> = self.get_json(&url).await?;
        Ok(commits.into_iter().next().map(|c| c.commit.committer.date))
    }

    /// Returns the last `per_page` commits that touched `path`, as `CommitInfo` records.
    pub async fn fetch_commits(
        &self,
        owner: &str,
        repo: &str,
        path: &str,
        per_page: usize,
    ) -> Result<Vec<CommitInfo>> {
        let url = format!(
            "https://api.github.com/repos/{}/{}/commits?path={}&per_page={}",
            owner, repo, path, per_page
        );
        let items: Vec<CommitListItem> = self.get_json(&url).await?;
        let commits = items
            .into_iter()
            .map(|c| CommitInfo {
                sha: c.sha.chars().take(8).collect(),
                message: c.commit.message.lines().next().unwrap_or("").to_string(),
                author: c.commit.author.name.clone(),
                date: c.commit.author.date.clone(),
            })
            .collect();
        Ok(commits)
    }

    /// Public version so API handlers can call it directly.
    pub async fn fetch_file_content_pub(&self, owner: &str, repo: &str, path: &str) -> Result<String> {
        let url = format!(
            "https://api.github.com/repos/{}/{}/contents/{}",
            owner, repo, path
        );
        let resp: ContentResponse = self.get_json(&url).await?;
        let encoding = resp.encoding.unwrap_or_default();
        let raw = resp.content.unwrap_or_default();

        if encoding == "base64" {
            let cleaned: String = raw.chars().filter(|c| !c.is_whitespace()).collect();
            let bytes = general_purpose::STANDARD
                .decode(&cleaned)
                .map_err(|e| anyhow!("base64 decode error: {}", e))?;
            Ok(String::from_utf8_lossy(&bytes).into_owned())
        } else {
            Ok(raw)
        }
    }
}

pub fn parse_repo_input(input: &str) -> Result<(String, String)> {
    let cleaned = input
        .trim()
        .trim_end_matches('/')
        .replace("https://github.com/", "")
        .replace("http://github.com/", "")
        .replace("github.com/", "");

    let parts: Vec<&str> = cleaned.splitn(2, '/').collect();
    if parts.len() != 2 || parts[0].is_empty() || parts[1].is_empty() {
        return Err(anyhow!(
            "Invalid repo format. Use 'owner/repo' or a GitHub URL."
        ));
    }
    // Strip any trailing path (e.g. /tree/main)
    let repo = parts[1].split('/').next().unwrap_or(parts[1]);
    Ok((parts[0].to_string(), repo.to_string()))
}
