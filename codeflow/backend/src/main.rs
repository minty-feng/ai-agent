use axum::{Router, routing::post, routing::get};
use tower_http::cors::{CorsLayer, Any};

mod api;
mod analyzer;
mod github;

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
        .layer(cors);

    let listener = tokio::net::TcpListener::bind("0.0.0.0:3001").await.unwrap();
    println!("Backend running on http://localhost:3001");
    axum::serve(listener, app).await.unwrap();
}
