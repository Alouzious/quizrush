mod config;
mod db;
mod errors;
mod game;
mod handlers;
mod middleware;
mod models;
mod routes;

use tower_http::{
    compression::CompressionLayer,
    cors::{Any, CorsLayer},
    trace::TraceLayer,
};
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    tracing_subscriber::registry()
        .with(tracing_subscriber::EnvFilter::new(
            std::env::var("RUST_LOG").unwrap_or_else(|_| "info".to_string()),
        ))
        .with(tracing_subscriber::fmt::layer())
        .init();

    let config = config::Config::from_env()?;
    tracing::info!("Starting QuizRush backend on {}:{}", config.host, config.port);

    let pool = db::create_pool(&config.database_url).await?;
    tracing::info!("Database connected");

    let rooms = game::new_room_store();

    let frontend_url = config.frontend_url.clone();
    let cors_origin = frontend_url
        .parse::<axum::http::HeaderValue>()
        .map_err(|e| anyhow::anyhow!("Invalid FRONTEND_URL: {}", e))?;
    let cors = CorsLayer::new()
        .allow_origin(cors_origin)
        .allow_methods(Any)
        .allow_headers(Any);

    let app = routes::create_router(pool, config.clone(), rooms)
        .layer(CompressionLayer::new())
        .layer(cors)
        .layer(TraceLayer::new_for_http());

    let addr = format!("{}:{}", config.host, config.port);
    let listener = tokio::net::TcpListener::bind(&addr).await?;
    tracing::info!("Listening on {}", addr);

    axum::serve(listener, app).await?;
    Ok(())
}
