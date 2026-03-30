use axum::{
    extract::{Path, State},
    Extension, Json,
};
use chrono::Utc;
use serde_json::{json, Value};
use sqlx::PgPool;
use uuid::Uuid;
use validator::Validate;

use crate::{
    config::Config,
    errors::{AppError, AppResult},
    models::{
        Answer, Claims, CreateQuizRequest, Question, QuestionWithAnswers, Quiz, QuizWithQuestions,
    },
};

pub async fn list_quizzes(
    Extension(claims): Extension<Claims>,
    State((pool, _config)): State<(PgPool, Config)>,
) -> AppResult<Json<Value>> {
    let host_id = Uuid::parse_str(&claims.sub)
        .map_err(|_| AppError::Auth("Invalid token".to_string()))?;

    let quizzes = sqlx::query_as::<_, Quiz>("SELECT * FROM quizzes WHERE host_id = $1 ORDER BY created_at DESC")
        .bind(host_id)
        .fetch_all(&pool)
        .await?;

    let mut quiz_list = Vec::new();
    for quiz in quizzes {
        let count: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM questions WHERE quiz_id = $1")
            .bind(quiz.id)
            .fetch_one(&pool)
            .await?;
        quiz_list.push(json!({
            "id": quiz.id,
            "title": quiz.title,
            "description": quiz.description,
            "is_public": quiz.is_public,
            "question_count": count,
            "created_at": quiz.created_at,
            "updated_at": quiz.updated_at,
        }));
    }

    Ok(Json(json!({
        "success": true,
        "data": quiz_list,
        "message": "Quizzes retrieved successfully"
    })))
}

pub async fn get_quiz(
    Extension(claims): Extension<Claims>,
    State((pool, _config)): State<(PgPool, Config)>,
    Path(quiz_id): Path<Uuid>,
) -> AppResult<Json<Value>> {
    let host_id = Uuid::parse_str(&claims.sub)
        .map_err(|_| AppError::Auth("Invalid token".to_string()))?;

    let quiz = sqlx::query_as::<_, Quiz>("SELECT * FROM quizzes WHERE id = $1 AND host_id = $2")
        .bind(quiz_id)
        .bind(host_id)
        .fetch_optional(&pool)
        .await?
        .ok_or_else(|| AppError::NotFound("Quiz not found".to_string()))?;

    let questions = get_questions_with_answers(&pool, quiz.id).await?;

    Ok(Json(json!({
        "success": true,
        "data": QuizWithQuestions {
            id: quiz.id,
            host_id: quiz.host_id,
            title: quiz.title.clone(),
            description: quiz.description.clone(),
            is_public: quiz.is_public,
            created_at: quiz.created_at,
            updated_at: quiz.updated_at,
            question_count: questions.len(),
            questions,
        },
        "message": "Quiz retrieved successfully"
    })))
}

pub async fn create_quiz(
    Extension(claims): Extension<Claims>,
    State((pool, _config)): State<(PgPool, Config)>,
    Json(req): Json<CreateQuizRequest>,
) -> AppResult<Json<Value>> {
    req.validate().map_err(|e| AppError::BadRequest(e.to_string()))?;

    let host_id = Uuid::parse_str(&claims.sub)
        .map_err(|_| AppError::Auth("Invalid token".to_string()))?;

    let now = Utc::now();
    let quiz = sqlx::query_as::<_, Quiz>(
        "INSERT INTO quizzes (id, host_id, title, description, is_public, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $6) RETURNING *"
    )
    .bind(Uuid::new_v4())
    .bind(host_id)
    .bind(&req.title)
    .bind(&req.description)
    .bind(req.is_public.unwrap_or(false))
    .bind(now)
    .fetch_one(&pool)
    .await?;

    if let Some(questions) = &req.questions {
        for (idx, q) in questions.iter().enumerate() {
            let question_id = Uuid::new_v4();
            sqlx::query(
                "INSERT INTO questions (id, quiz_id, text, image_url, time_limit, points, order_index, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)"
            )
            .bind(question_id)
            .bind(quiz.id)
            .bind(&q.text)
            .bind(&q.image_url)
            .bind(q.time_limit.unwrap_or(20))
            .bind(q.points.unwrap_or(1000))
            .bind(q.order_index.unwrap_or(idx as i32))
            .bind(now)
            .execute(&pool)
            .await?;

            for (aidx, a) in q.answers.iter().enumerate() {
                sqlx::query(
                    "INSERT INTO answers (id, question_id, text, is_correct, order_index) VALUES ($1, $2, $3, $4, $5)"
                )
                .bind(Uuid::new_v4())
                .bind(question_id)
                .bind(&a.text)
                .bind(a.is_correct)
                .bind(a.order_index.unwrap_or(aidx as i32))
                .execute(&pool)
                .await?;
            }
        }
    }

    let questions = get_questions_with_answers(&pool, quiz.id).await?;

    Ok(Json(json!({
        "success": true,
        "data": QuizWithQuestions {
            id: quiz.id,
            host_id: quiz.host_id,
            title: quiz.title.clone(),
            description: quiz.description.clone(),
            is_public: quiz.is_public,
            created_at: quiz.created_at,
            updated_at: quiz.updated_at,
            question_count: questions.len(),
            questions,
        },
        "message": "Quiz created successfully"
    })))
}

pub async fn update_quiz(
    Extension(claims): Extension<Claims>,
    State((pool, _config)): State<(PgPool, Config)>,
    Path(quiz_id): Path<Uuid>,
    Json(req): Json<CreateQuizRequest>,
) -> AppResult<Json<Value>> {
    req.validate().map_err(|e| AppError::BadRequest(e.to_string()))?;

    let host_id = Uuid::parse_str(&claims.sub)
        .map_err(|_| AppError::Auth("Invalid token".to_string()))?;

    let quiz = sqlx::query_as::<_, Quiz>(
        "UPDATE quizzes SET title = $1, description = $2, is_public = $3, updated_at = $4 WHERE id = $5 AND host_id = $6 RETURNING *"
    )
    .bind(&req.title)
    .bind(&req.description)
    .bind(req.is_public.unwrap_or(false))
    .bind(Utc::now())
    .bind(quiz_id)
    .bind(host_id)
    .fetch_optional(&pool)
    .await?
    .ok_or_else(|| AppError::NotFound("Quiz not found".to_string()))?;

    if let Some(questions) = &req.questions {
        sqlx::query("DELETE FROM questions WHERE quiz_id = $1")
            .bind(quiz.id)
            .execute(&pool)
            .await?;

        let now = Utc::now();
        for (idx, q) in questions.iter().enumerate() {
            let question_id = Uuid::new_v4();
            sqlx::query(
                "INSERT INTO questions (id, quiz_id, text, image_url, time_limit, points, order_index, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)"
            )
            .bind(question_id)
            .bind(quiz.id)
            .bind(&q.text)
            .bind(&q.image_url)
            .bind(q.time_limit.unwrap_or(20))
            .bind(q.points.unwrap_or(1000))
            .bind(q.order_index.unwrap_or(idx as i32))
            .bind(now)
            .execute(&pool)
            .await?;

            for (aidx, a) in q.answers.iter().enumerate() {
                sqlx::query(
                    "INSERT INTO answers (id, question_id, text, is_correct, order_index) VALUES ($1, $2, $3, $4, $5)"
                )
                .bind(Uuid::new_v4())
                .bind(question_id)
                .bind(&a.text)
                .bind(a.is_correct)
                .bind(a.order_index.unwrap_or(aidx as i32))
                .execute(&pool)
                .await?;
            }
        }
    }

    let questions = get_questions_with_answers(&pool, quiz.id).await?;

    Ok(Json(json!({
        "success": true,
        "data": QuizWithQuestions {
            id: quiz.id,
            host_id: quiz.host_id,
            title: quiz.title,
            description: quiz.description,
            is_public: quiz.is_public,
            created_at: quiz.created_at,
            updated_at: quiz.updated_at,
            question_count: questions.len(),
            questions,
        },
        "message": "Quiz updated successfully"
    })))
}

pub async fn delete_quiz(
    Extension(claims): Extension<Claims>,
    State((pool, _config)): State<(PgPool, Config)>,
    Path(quiz_id): Path<Uuid>,
) -> AppResult<Json<Value>> {
    let host_id = Uuid::parse_str(&claims.sub)
        .map_err(|_| AppError::Auth("Invalid token".to_string()))?;

    let result = sqlx::query("DELETE FROM quizzes WHERE id = $1 AND host_id = $2")
        .bind(quiz_id)
        .bind(host_id)
        .execute(&pool)
        .await?;

    if result.rows_affected() == 0 {
        return Err(AppError::NotFound("Quiz not found".to_string()));
    }

    Ok(Json(json!({
        "success": true,
        "data": null,
        "message": "Quiz deleted successfully"
    })))
}

pub async fn get_questions_with_answers(pool: &PgPool, quiz_id: Uuid) -> AppResult<Vec<QuestionWithAnswers>> {
    let questions = sqlx::query_as::<_, Question>(
        "SELECT * FROM questions WHERE quiz_id = $1 ORDER BY order_index ASC"
    )
    .bind(quiz_id)
    .fetch_all(pool)
    .await?;

    let mut result = Vec::new();
    for q in questions {
        let answers = sqlx::query_as::<_, Answer>(
            "SELECT * FROM answers WHERE question_id = $1 ORDER BY order_index ASC"
        )
        .bind(q.id)
        .fetch_all(pool)
        .await?;
        result.push(QuestionWithAnswers {
            id: q.id,
            quiz_id: q.quiz_id,
            text: q.text,
            image_url: q.image_url,
            time_limit: q.time_limit,
            points: q.points,
            order_index: q.order_index,
            answers,
        });
    }
    Ok(result)
}
