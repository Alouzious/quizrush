use axum::{
    extract::{Path, State},
    Extension, Json,
};
use chrono::Utc;
use serde_json::{json, Value};
use sqlx::PgPool;
use uuid::Uuid;

use crate::{
    config::Config,
    errors::{AppError, AppResult},
    game::{engine::generate_room_code, room::GameRoom as InMemoryRoom, RoomStore},
    models::{Claims, GameRoom, GameRoomResponse, QuizSummary},
};

pub async fn create_game(
    Extension(claims): Extension<Claims>,
    State((pool, _config, rooms)): State<(PgPool, Config, RoomStore)>,
    Json(body): Json<serde_json::Value>,
) -> AppResult<Json<Value>> {
    let host_id = Uuid::parse_str(&claims.sub)
        .map_err(|_| AppError::Auth("Invalid token".to_string()))?;

    let quiz_id: Uuid = body["quiz_id"]
        .as_str()
        .and_then(|s| Uuid::parse_str(s).ok())
        .ok_or_else(|| AppError::BadRequest("quiz_id is required".to_string()))?;

    let quiz_count: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM quizzes WHERE id = $1 AND host_id = $2")
        .bind(quiz_id)
        .bind(host_id)
        .fetch_one(&pool)
        .await?;

    if quiz_count == 0 {
        return Err(AppError::NotFound("Quiz not found".to_string()));
    }

    let mut room_code = generate_room_code();
    loop {
        let exists: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM game_rooms WHERE room_code = $1 AND status != 'finished'")
            .bind(&room_code)
            .fetch_one(&pool)
            .await?;
        if exists == 0 { break; }
        room_code = generate_room_code();
    }

    let now = Utc::now();
    let game = sqlx::query_as::<_, GameRoom>(
        "INSERT INTO game_rooms (id, quiz_id, host_id, room_code, status, current_question_index, created_at) VALUES ($1, $2, $3, $4, 'waiting', 0, $5) RETURNING *"
    )
    .bind(Uuid::new_v4())
    .bind(quiz_id)
    .bind(host_id)
    .bind(&room_code)
    .bind(now)
    .fetch_one(&pool)
    .await?;

    let mem_room = InMemoryRoom::new(game.id, room_code.clone(), quiz_id, host_id);
    rooms.insert(room_code.clone(), mem_room);

    Ok(Json(json!({
        "success": true,
        "data": { "room_code": room_code, "game_id": game.id },
        "message": "Game room created successfully"
    })))
}

pub async fn get_room(
    State((pool, _config, _rooms)): State<(PgPool, Config, RoomStore)>,
    Path(room_code): Path<String>,
) -> AppResult<Json<Value>> {
    let room_code = room_code.to_uppercase();

    let game = sqlx::query_as::<_, GameRoom>(
        "SELECT * FROM game_rooms WHERE room_code = $1"
    )
    .bind(&room_code)
    .fetch_optional(&pool)
    .await?
    .ok_or_else(|| AppError::NotFound("Room not found".to_string()))?;

    let quiz = sqlx::query_as::<_, crate::models::Quiz>(
        "SELECT * FROM quizzes WHERE id = $1"
    )
    .bind(game.quiz_id)
    .fetch_one(&pool)
    .await?;

    let q_count: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM questions WHERE quiz_id = $1")
        .bind(quiz.id)
        .fetch_one(&pool)
        .await?;

    let player_count: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM game_players WHERE game_id = $1")
        .bind(game.id)
        .fetch_one(&pool)
        .await?;

    Ok(Json(json!({
        "success": true,
        "data": GameRoomResponse {
            id: game.id,
            room_code: game.room_code,
            status: game.status,
            quiz: QuizSummary { id: quiz.id, title: quiz.title, question_count: q_count },
            player_count,
            created_at: game.created_at,
        },
        "message": "Room found"
    })))
}

pub async fn get_results(
    Extension(claims): Extension<Claims>,
    State((pool, _config, _rooms)): State<(PgPool, Config, RoomStore)>,
    Path(game_id): Path<Uuid>,
) -> AppResult<Json<Value>> {
    let host_id = Uuid::parse_str(&claims.sub)
        .map_err(|_| AppError::Auth("Invalid token".to_string()))?;

    let game = sqlx::query_as::<_, GameRoom>("SELECT * FROM game_rooms WHERE id = $1 AND host_id = $2")
        .bind(game_id)
        .bind(host_id)
        .fetch_optional(&pool)
        .await?
        .ok_or_else(|| AppError::NotFound("Game not found".to_string()))?;

    let players = sqlx::query_as::<_, crate::models::GamePlayer>(
        "SELECT * FROM game_players WHERE game_id = $1 ORDER BY score DESC"
    )
    .bind(game.id)
    .fetch_all(&pool)
    .await?;

    Ok(Json(json!({
        "success": true,
        "data": {
            "game": game,
            "leaderboard": players
        },
        "message": "Results retrieved successfully"
    })))
}
