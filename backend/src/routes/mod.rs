use axum::{
    middleware,
    routing::{delete, get, post, put},
    Router,
};
use sqlx::PgPool;

use crate::{
    config::Config,
    game::RoomStore,
    handlers::{auth, game, quiz, websocket},
    middleware::auth_middleware,
};

pub fn create_router(pool: PgPool, config: Config, rooms: RoomStore) -> Router {
    let state = (pool.clone(), config.clone(), rooms.clone());
    let auth_state = (pool.clone(), config.clone());

    // Public routes with (PgPool, Config) state
    let auth_public = Router::new()
        .route("/auth/register", post(auth::register))
        .route("/auth/login", post(auth::login))
        .with_state(auth_state.clone());

    // Protected routes with (PgPool, Config) state
    let auth_quiz_protected = Router::new()
        .route("/auth/me", get(auth::me))
        .route("/quizzes", get(quiz::list_quizzes))
        .route("/quizzes", post(quiz::create_quiz))
        .route("/quizzes/:id", get(quiz::get_quiz))
        .route("/quizzes/:id", put(quiz::update_quiz))
        .route("/quizzes/:id", delete(quiz::delete_quiz))
        .route_layer(middleware::from_fn_with_state(config.clone(), auth_middleware))
        .with_state(auth_state);

    // Public routes with (PgPool, Config, RoomStore) state
    let game_public = Router::new()
        .route("/games/room/:room_code", get(game::get_room))
        .with_state(state.clone());

    // Protected routes with (PgPool, Config, RoomStore) state
    let game_protected = Router::new()
        .route("/games", post(game::create_game))
        .route("/games/:id/results", get(game::get_results))
        .route_layer(middleware::from_fn_with_state(config.clone(), auth_middleware))
        .with_state(state.clone());

    let ws_routes = Router::new()
        .route("/ws", get(websocket::ws_handler))
        .with_state(state);

    Router::new()
        .nest("/api/v1", auth_public)
        .nest("/api/v1", auth_quiz_protected)
        .nest("/api/v1", game_public)
        .nest("/api/v1", game_protected)
        .merge(ws_routes)
}
