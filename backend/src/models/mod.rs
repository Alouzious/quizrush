use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;
use validator::Validate;

// ======================== DATABASE MODELS ========================

#[derive(Debug, Serialize, Deserialize, sqlx::FromRow, Clone)]
pub struct User {
    pub id: Uuid,
    pub email: String,
    #[serde(skip_serializing)]
    pub password_hash: String,
    pub name: String,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Serialize, Deserialize, sqlx::FromRow, Clone)]
pub struct Quiz {
    pub id: Uuid,
    pub host_id: Uuid,
    pub title: String,
    pub description: Option<String>,
    pub is_public: bool,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Serialize, Deserialize, sqlx::FromRow, Clone)]
pub struct Question {
    pub id: Uuid,
    pub quiz_id: Uuid,
    pub text: String,
    pub image_url: Option<String>,
    pub time_limit: i32,
    pub points: i32,
    pub order_index: i32,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Serialize, Deserialize, sqlx::FromRow, Clone)]
pub struct Answer {
    pub id: Uuid,
    pub question_id: Uuid,
    pub text: String,
    pub is_correct: bool,
    pub order_index: i32,
}

#[derive(Debug, Serialize, Deserialize, sqlx::FromRow, Clone)]
pub struct GameRoom {
    pub id: Uuid,
    pub quiz_id: Uuid,
    pub host_id: Uuid,
    pub room_code: String,
    pub status: String,
    pub current_question_index: i32,
    pub started_at: Option<DateTime<Utc>>,
    pub ended_at: Option<DateTime<Utc>>,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Serialize, Deserialize, sqlx::FromRow, Clone)]
pub struct GamePlayer {
    pub id: Uuid,
    pub game_id: Uuid,
    pub nickname: String,
    pub score: i32,
    pub is_connected: bool,
    pub joined_at: DateTime<Utc>,
}

#[derive(Debug, Serialize, Deserialize, sqlx::FromRow, Clone)]
pub struct GameAnswer {
    pub id: Uuid,
    pub game_id: Uuid,
    pub player_id: Uuid,
    pub question_id: Uuid,
    pub answer_id: Option<Uuid>,
    pub is_correct: bool,
    pub points_earned: i32,
    pub answered_at: DateTime<Utc>,
    pub response_time_ms: i64,
}

// ======================== REQUEST DTOs ========================

#[derive(Debug, Deserialize, Validate)]
pub struct RegisterRequest {
    #[validate(email(message = "Invalid email address"))]
    pub email: String,
    #[validate(length(min = 2, max = 100, message = "Name must be between 2 and 100 characters"))]
    pub name: String,
    #[validate(length(min = 8, message = "Password must be at least 8 characters"))]
    pub password: String,
}

#[derive(Debug, Deserialize, Validate)]
pub struct LoginRequest {
    #[validate(email(message = "Invalid email address"))]
    pub email: String,
    pub password: String,
}

#[derive(Debug, Deserialize, Validate)]
pub struct CreateQuizRequest {
    #[validate(length(min = 1, max = 200, message = "Title must be between 1 and 200 characters"))]
    pub title: String,
    pub description: Option<String>,
    pub is_public: Option<bool>,
    pub questions: Option<Vec<CreateQuestionRequest>>,
}

#[derive(Debug, Deserialize, Validate, Clone)]
pub struct CreateQuestionRequest {
    #[validate(length(min = 1, max = 500, message = "Question text is required"))]
    pub text: String,
    pub image_url: Option<String>,
    pub time_limit: Option<i32>,
    pub points: Option<i32>,
    pub order_index: Option<i32>,
    pub answers: Vec<CreateAnswerRequest>,
}

#[derive(Debug, Deserialize, Clone)]
pub struct CreateAnswerRequest {
    pub text: String,
    pub is_correct: bool,
    pub order_index: Option<i32>,
}

#[derive(Debug, Deserialize)]
pub struct JoinRoomRequest {
    pub nickname: String,
}

// ======================== RESPONSE DTOs ========================

#[derive(Debug, Serialize)]
pub struct AuthResponse {
    pub token: String,
    pub user: UserPublic,
}

#[derive(Debug, Serialize, Clone)]
pub struct UserPublic {
    pub id: Uuid,
    pub email: String,
    pub name: String,
}

#[derive(Debug, Serialize)]
pub struct QuizWithQuestions {
    pub id: Uuid,
    pub host_id: Uuid,
    pub title: String,
    pub description: Option<String>,
    pub is_public: bool,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub questions: Vec<QuestionWithAnswers>,
    pub question_count: usize,
}

#[derive(Debug, Serialize, Clone)]
pub struct QuestionWithAnswers {
    pub id: Uuid,
    pub quiz_id: Uuid,
    pub text: String,
    pub image_url: Option<String>,
    pub time_limit: i32,
    pub points: i32,
    pub order_index: i32,
    pub answers: Vec<Answer>,
}

#[derive(Debug, Serialize)]
pub struct GameRoomResponse {
    pub id: Uuid,
    pub room_code: String,
    pub status: String,
    pub quiz: QuizSummary,
    pub player_count: i64,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Serialize)]
pub struct QuizSummary {
    pub id: Uuid,
    pub title: String,
    pub question_count: i64,
}

#[derive(Debug, Serialize, Clone)]
pub struct PlayerPublic {
    pub id: Uuid,
    pub nickname: String,
    pub score: i32,
}

// ======================== JWT CLAIMS ========================

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Claims {
    pub sub: String,
    pub email: String,
    pub name: String,
    pub exp: usize,
    pub iat: usize,
}
