use axum::{extract::State, Json};
use bcrypt::{hash, verify, DEFAULT_COST};
use chrono::Utc;
use jsonwebtoken::{encode, EncodingKey, Header};
use serde_json::{json, Value};
use sqlx::PgPool;
use uuid::Uuid;
use validator::Validate;

use crate::{
    config::Config,
    errors::{AppError, AppResult},
    models::{AuthResponse, Claims, LoginRequest, RegisterRequest, UserPublic},
};

pub async fn register(
    State((pool, config)): State<(PgPool, Config)>,
    Json(req): Json<RegisterRequest>,
) -> AppResult<Json<Value>> {
    req.validate().map_err(|e| AppError::BadRequest(e.to_string()))?;

    let existing = sqlx::query_scalar::<_, i64>("SELECT COUNT(*) FROM users WHERE email = $1")
        .bind(&req.email)
        .fetch_one(&pool)
        .await?;

    if existing > 0 {
        return Err(AppError::Conflict("An account with this email already exists".to_string()));
    }

    let password_hash = hash(&req.password, DEFAULT_COST)
        .map_err(|e| AppError::Internal(format!("Password hashing failed: {}", e)))?;

    let user = sqlx::query_as::<_, crate::models::User>(
        "INSERT INTO users (id, email, password_hash, name, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $5) RETURNING *"
    )
    .bind(Uuid::new_v4())
    .bind(&req.email)
    .bind(&password_hash)
    .bind(&req.name)
    .bind(Utc::now())
    .fetch_one(&pool)
    .await?;

    let token = create_token(&user, &config)?;

    Ok(Json(json!({
        "success": true,
        "data": AuthResponse {
            token,
            user: UserPublic { id: user.id, email: user.email, name: user.name }
        },
        "message": "Registration successful"
    })))
}

pub async fn login(
    State((pool, config)): State<(PgPool, Config)>,
    Json(req): Json<LoginRequest>,
) -> AppResult<Json<Value>> {
    req.validate().map_err(|e| AppError::BadRequest(e.to_string()))?;

    let user = sqlx::query_as::<_, crate::models::User>("SELECT * FROM users WHERE email = $1")
        .bind(&req.email)
        .fetch_optional(&pool)
        .await?
        .ok_or_else(|| AppError::Auth("Invalid email or password".to_string()))?;

    let valid = verify(&req.password, &user.password_hash)
        .map_err(|e| AppError::Internal(format!("Password verification failed: {}", e)))?;

    if !valid {
        return Err(AppError::Auth("Invalid email or password".to_string()));
    }

    let token = create_token(&user, &config)?;

    Ok(Json(json!({
        "success": true,
        "data": AuthResponse {
            token,
            user: UserPublic { id: user.id, email: user.email.clone(), name: user.name.clone() }
        },
        "message": "Login successful"
    })))
}

pub async fn me(
    axum::Extension(claims): axum::Extension<Claims>,
    State((pool, _config)): State<(PgPool, Config)>,
) -> AppResult<Json<Value>> {
    let user_id = Uuid::parse_str(&claims.sub)
        .map_err(|_| AppError::Auth("Invalid token subject".to_string()))?;

    let user = sqlx::query_as::<_, crate::models::User>("SELECT * FROM users WHERE id = $1")
        .bind(user_id)
        .fetch_optional(&pool)
        .await?
        .ok_or_else(|| AppError::NotFound("User not found".to_string()))?;

    Ok(Json(json!({
        "success": true,
        "data": UserPublic { id: user.id, email: user.email, name: user.name },
        "message": "User retrieved successfully"
    })))
}

fn create_token(user: &crate::models::User, config: &Config) -> AppResult<String> {
    let now = Utc::now().timestamp() as usize;
    let exp = now + (config.jwt_expiry_hours as usize * 3600);
    let claims = Claims {
        sub: user.id.to_string(),
        email: user.email.clone(),
        name: user.name.clone(),
        exp,
        iat: now,
    };
    encode(
        &Header::default(),
        &claims,
        &EncodingKey::from_secret(config.jwt_secret.as_bytes()),
    )
    .map_err(|e| AppError::Internal(format!("Token creation failed: {}", e)))
}
