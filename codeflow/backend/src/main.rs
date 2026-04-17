use axum::{Router, routing::post, routing::get};
use tower_http::cors::{CorsLayer, Any};

mod api;
mod analyzer;
mod build_parser;
mod github;
mod local;

#[tokio::main]
async fn main() {
    tracing_subscriber::fmt::init();

    let cors = CorsLayer::new()
        .allow_origin(Any)
        .allow_methods(Any)
        .allow_headers(Any);

    let app = Router::new()
        .route("/health", get(|| async { "ok" }))
        .route("/api/analyze", post(api::analyze_repo))
        .route("/api/tree/{owner}/{repo}", get(api::get_tree))
        .route("/api/file/{owner}/{repo}", get(api::get_file))
        .route("/api/build-deps", post(api::get_build_deps))
        .route("/api/gtest-analyze", post(api::gtest_analyze))
        .route("/api/local/tree", post(api::local_tree))
        .route("/api/local/analyze", post(api::local_analyze))
        .route("/api/local/build-deps", post(api::local_build_deps))
        .route("/api/local/gtest-analyze", post(api::local_gtest_analyze))
        .layer(cors);

    let listener = tokio::net::TcpListener::bind("0.0.0.0:3001").await.unwrap();
    println!("Backend running on http://localhost:3001");
    axum::serve(listener, app).await.unwrap();
}
