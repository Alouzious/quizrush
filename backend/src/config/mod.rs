use dotenvy::dotenv;
use std::env;

#[derive(Clone, Debug)]
pub struct Config {
    pub database_url: String,
    pub jwt_secret: String,
    pub jwt_expiry_hours: u64,
    pub frontend_url: String,
    pub host: String,
    pub port: u16,
}

impl Config {
    pub fn from_env() -> anyhow::Result<Self> {
        dotenv().ok();
        Ok(Config {
            database_url: env::var("DATABASE_URL").unwrap_or_else(|_| "postgresql://localhost/quizrush".to_string()),
            jwt_secret: env::var("JWT_SECRET").unwrap_or_else(|_| "dev_secret_change_in_production_please_use_long_random_string".to_string()),
            jwt_expiry_hours: env::var("JWT_EXPIRY_HOURS").unwrap_or_else(|_| "24".to_string()).parse().unwrap_or(24),
            frontend_url: env::var("FRONTEND_URL").unwrap_or_else(|_| "http://localhost:5173".to_string()),
            host: env::var("HOST").unwrap_or_else(|_| "0.0.0.0".to_string()),
            port: env::var("PORT").unwrap_or_else(|_| "8080".to_string()).parse().unwrap_or(8080),
        })
    }
}
