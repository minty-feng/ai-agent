use axum::{extract::Json, http::StatusCode};
use serde::{Deserialize, Serialize};
use crate::analyzer::{self, AnalysisResult};
use crate::github::{GithubClient, parse_repo_input};

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
