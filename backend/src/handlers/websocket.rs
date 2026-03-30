use axum::{
    extract::{
        ws::{Message, WebSocket},
        State, WebSocketUpgrade,
    },
    response::Response,
};
use futures_util::{SinkExt, StreamExt};
use serde::Deserialize;
use serde_json::{json, Value};
use sqlx::PgPool;
use tokio::sync::mpsc;
use uuid::Uuid;
use chrono::Utc;

use crate::{
    config::Config,
    game::{
        engine::{calculate_score, current_timestamp_ms},
        player::Player,
        RoomStore,
    },
    handlers::quiz::get_questions_with_answers,
    models::Answer,
};

#[derive(Debug, Deserialize)]
#[serde(tag = "event", rename_all = "snake_case")]
pub enum ClientEvent {
    JoinRoom { room_code: String, nickname: String, player_id: Option<String> },
    HostJoin { room_code: String, token: String },
    SubmitAnswer { question_id: String, answer_id: String },
    HostStartGame,
    HostNextQuestion,
    HostEndGame,
    Ping,
}

pub async fn ws_handler(
    ws: WebSocketUpgrade,
    State((pool, _config, rooms)): State<(PgPool, Config, RoomStore)>,
) -> Response {
    ws.on_upgrade(move |socket| handle_socket(socket, pool, rooms))
}

async fn handle_socket(socket: WebSocket, pool: PgPool, rooms: RoomStore) {
    let (mut sink, mut stream) = socket.split();
    let (tx, mut rx) = mpsc::unbounded_channel::<Message>();

    let send_task = tokio::spawn(async move {
        while let Some(msg) = rx.recv().await {
            if sink.send(msg).await.is_err() {
                break;
            }
        }
    });

    let tx_clone = tx.clone();
    let mut player_id: Option<Uuid> = None;
    let mut room_code: Option<String> = None;
    let mut is_host = false;

    while let Some(Ok(msg)) = stream.next().await {
        let text = match msg {
            Message::Text(t) => t.to_string(),
            Message::Close(_) => break,
            Message::Ping(_) => {
                let _ = tx_clone.send(Message::Pong(vec![].into()));
                continue;
            }
            _ => continue,
        };

        let event: ClientEvent = match serde_json::from_str(&text) {
            Ok(e) => e,
            Err(e) => {
                let err = json!({"event": "error", "message": format!("Invalid message: {}", e)}).to_string();
                let _ = tx_clone.send(Message::Text(err.into()));
                continue;
            }
        };

        match event {
            ClientEvent::JoinRoom { room_code: rc, nickname, player_id: existing_pid } => {
                let rc = rc.to_uppercase();

                let game = sqlx::query_as::<_, crate::models::GameRoom>(
                    "SELECT * FROM game_rooms WHERE room_code = $1 AND status != 'finished'"
                )
                .bind(&rc)
                .fetch_optional(&pool)
                .await;

                match game {
                    Ok(Some(game)) => {
                        let pid = existing_pid
                            .and_then(|s| Uuid::parse_str(&s).ok())
                            .unwrap_or_else(Uuid::new_v4);

                        player_id = Some(pid);
                        room_code = Some(rc.clone());

                        sqlx::query(
                            "INSERT INTO game_players (id, game_id, nickname, score, is_connected, joined_at) VALUES ($1, $2, $3, 0, true, $4) ON CONFLICT (id) DO UPDATE SET is_connected = true, nickname = $3"
                        )
                        .bind(pid)
                        .bind(game.id)
                        .bind(&nickname)
                        .bind(Utc::now())
                        .execute(&pool)
                        .await.ok();

                        let mut notify_players: Option<Vec<Value>> = None;
                        if let Some(mut room) = rooms.get_mut(&rc) {
                            let existing_score = room.players.get(&pid).map(|p| p.score);
                            let mut player = Player::new(pid, nickname.clone(), tx_clone.clone());
                            if let Some(score) = existing_score {
                                player.score = score;
                            }
                            room.add_player(player);

                            let players_json: Vec<Value> = room.get_player_summaries()
                                .iter()
                                .map(|p| json!({"id": p.id, "nickname": p.nickname, "score": p.score}))
                                .collect();
                            notify_players = Some(players_json);
                        }

                        let connected = json!({
                            "event": "connected",
                            "player_id": pid.to_string(),
                            "room_code": rc,
                            "status": game.status
                        }).to_string();
                        let _ = tx_clone.send(Message::Text(connected.into()));

                        if let Some(players_json) = notify_players {
                            if let Some(room) = rooms.get(&rc) {
                                let msg = json!({
                                    "event": "player_joined",
                                    "data": { "players": players_json }
                                }).to_string();
                                room.broadcast_all(&msg);
                            }
                        }
                    }
                    _ => {
                        let err = json!({"event": "error", "message": "Room not found or already finished"}).to_string();
                        let _ = tx_clone.send(Message::Text(err.into()));
                    }
                }
            }

            ClientEvent::HostJoin { room_code: rc, token: _ } => {
                let rc = rc.to_uppercase();
                room_code = Some(rc.clone());
                is_host = true;

                if let Some(mut room) = rooms.get_mut(&rc) {
                    room.host_sender = Some(tx_clone.clone());

                    let players_json: Vec<Value> = room.get_player_summaries()
                        .iter()
                        .map(|p| json!({"id": p.id, "nickname": p.nickname, "score": p.score}))
                        .collect();

                    let status_str = match room.status {
                        crate::game::room::RoomStatus::Waiting => "waiting",
                        crate::game::room::RoomStatus::Active => "active",
                        crate::game::room::RoomStatus::Finished => "finished",
                    };

                    let msg = json!({
                        "event": "room_info",
                        "data": {
                            "room_code": rc,
                            "players": players_json,
                            "status": status_str
                        }
                    }).to_string();
                    let _ = tx_clone.send(Message::Text(msg.into()));
                } else {
                    let err = json!({"event": "error", "message": "Room not found"}).to_string();
                    let _ = tx_clone.send(Message::Text(err.into()));
                }
            }

            ClientEvent::HostStartGame => {
                if !is_host {
                    let err = json!({"event": "error", "message": "Not authorized"}).to_string();
                    let _ = tx_clone.send(Message::Text(err.into()));
                    continue;
                }
                if let Some(rc) = &room_code {
                    let quiz_id = rooms.get(rc).map(|r| r.quiz_id);
                    if let Some(qid) = quiz_id {
                        match get_questions_with_answers(&pool, qid).await {
                            Ok(qs) if !qs.is_empty() => {
                                let first_q = qs[0].clone();
                                let total = qs.len();
                                if let Some(mut room) = rooms.get_mut(rc) {
                                    room.questions = qs;
                                    room.current_question_index = 0;
                                    room.status = crate::game::room::RoomStatus::Active;
                                    room.question_start_time = Some(current_timestamp_ms());
                                    room.answers_received.clear();
                                }

                                sqlx::query("UPDATE game_rooms SET status = 'active', started_at = $1 WHERE room_code = $2")
                                    .bind(Utc::now())
                                    .bind(rc)
                                    .execute(&pool)
                                    .await.ok();

                                let question_json = build_question_json(&first_q, false);
                                let msg = json!({
                                    "event": "game_started",
                                    "data": {
                                        "question": question_json,
                                        "timer": first_q.time_limit,
                                        "question_number": 1,
                                        "total_questions": total
                                    }
                                }).to_string();

                                if let Some(room) = rooms.get(rc) {
                                    room.broadcast_all(&msg);
                                }
                            }
                            _ => {
                                let err = json!({"event": "error", "message": "Quiz has no questions"}).to_string();
                                let _ = tx_clone.send(Message::Text(err.into()));
                            }
                        }
                    }
                }
            }

            ClientEvent::SubmitAnswer { question_id, answer_id } => {
                if let (Some(pid), Some(rc)) = (&player_id, &room_code) {
                    let question_id_uuid = Uuid::parse_str(&question_id).ok();
                    let answer_id_uuid = Uuid::parse_str(&answer_id).ok();

                    if let (Some(quid), Some(auid)) = (question_id_uuid, answer_id_uuid) {
                        let already_answered = rooms.get(rc)
                            .map(|r| r.answers_received.contains_key(pid))
                            .unwrap_or(true);

                        if already_answered {
                            continue;
                        }

                        let answer = sqlx::query_as::<_, Answer>(
                            "SELECT * FROM answers WHERE id = $1 AND question_id = $2"
                        )
                        .bind(auid)
                        .bind(quid)
                        .fetch_optional(&pool)
                        .await
                        .ok()
                        .flatten();

                        let (is_correct, correct_answer_id) = match &answer {
                            Some(a) => {
                                let correct_ans = sqlx::query_as::<_, Answer>(
                                    "SELECT * FROM answers WHERE question_id = $1 AND is_correct = true LIMIT 1"
                                )
                                .bind(quid)
                                .fetch_optional(&pool)
                                .await
                                .ok()
                                .flatten();
                                (a.is_correct, correct_ans.map(|ca| ca.id.to_string()).unwrap_or_default())
                            }
                            None => (false, String::new()),
                        };

                        let mut points_earned = 0i32;
                        let mut response_time_ms_val = 0i64;
                        let mut all_answered = false;

                        if let Some(mut room) = rooms.get_mut(rc) {
                            let start_time = room.question_start_time.unwrap_or_else(|| current_timestamp_ms());
                            let response_time_ms = current_timestamp_ms() - start_time;
                            response_time_ms_val = response_time_ms;

                            if let Some(q) = room.current_question() {
                                let time_limit = q.time_limit;
                                let points = q.points;
                                points_earned = calculate_score(is_correct, time_limit, response_time_ms, points);
                            }

                            if let Some(player) = room.players.get_mut(pid) {
                                player.score += points_earned;
                            }
                            room.answers_received.insert(*pid, is_correct);

                            let result_msg = json!({
                                "event": "answer_received",
                                "data": {
                                    "correct": is_correct,
                                    "points": points_earned,
                                    "correct_answer_id": correct_answer_id
                                }
                            }).to_string();
                            if let Some(player) = room.players.get(pid) {
                                player.send(Message::Text(result_msg.into()));
                            }

                            all_answered = room.all_answered();

                            if all_answered {
                                let stats: Vec<Value> = room.questions.get(room.current_question_index)
                                    .map(|q| {
                                        q.answers.iter().map(|a| {
                                            json!({"answer_id": a.id, "text": a.text, "count": 0, "is_correct": a.is_correct})
                                        }).collect()
                                    })
                                    .unwrap_or_default();

                                let stats_msg = json!({
                                    "event": "answer_stats",
                                    "data": { "stats": stats, "question_id": question_id }
                                }).to_string();
                                room.send_to_host(&stats_msg);
                            }
                        }

                        sqlx::query(
                            "INSERT INTO game_answers (id, game_id, player_id, question_id, answer_id, is_correct, points_earned, answered_at, response_time_ms) SELECT $1, gr.id, $3, $4, $5, $6, $7, $8, $9 FROM game_rooms gr WHERE gr.room_code = $2"
                        )
                        .bind(Uuid::new_v4())
                        .bind(rc.as_str())
                        .bind(pid)
                        .bind(quid)
                        .bind(auid)
                        .bind(is_correct)
                        .bind(points_earned)
                        .bind(Utc::now())
                        .bind(response_time_ms_val)
                        .execute(&pool)
                        .await.ok();

                        let new_score = rooms.get(rc)
                            .and_then(|r| r.players.get(pid).map(|p| p.score));
                        if let Some(score) = new_score {
                            sqlx::query("UPDATE game_players SET score = $1 WHERE id = $2")
                                .bind(score)
                                .bind(pid)
                                .execute(&pool)
                                .await.ok();
                        }
                    }
                }
            }

            ClientEvent::HostNextQuestion => {
                if !is_host { continue; }
                if let Some(rc) = &room_code {
                    let (next_idx, total) = {
                        let room_ref = rooms.get(rc);
                        match room_ref {
                            Some(r) => (r.current_question_index + 1, r.questions.len()),
                            None => continue,
                        }
                    };

                    let leaderboard: Vec<Value> = rooms.get(rc).map(|r| {
                        r.get_leaderboard().iter().map(|p| json!({"id": p.id, "nickname": p.nickname, "score": p.score})).collect()
                    }).unwrap_or_default();

                    let lb_msg = json!({
                        "event": "leaderboard_update",
                        "data": {
                            "leaderboard": leaderboard,
                            "question_number": next_idx
                        }
                    }).to_string();

                    if let Some(room) = rooms.get(rc) {
                        room.broadcast_all(&lb_msg);
                    }

                    if next_idx >= total {
                        if let Some(mut room) = rooms.get_mut(rc) {
                            room.status = crate::game::room::RoomStatus::Finished;
                        }
                        sqlx::query("UPDATE game_rooms SET status = 'finished', ended_at = $1 WHERE room_code = $2")
                            .bind(Utc::now())
                            .bind(rc)
                            .execute(&pool)
                            .await.ok();

                        let winner = leaderboard.first().cloned();
                        let end_msg = json!({
                            "event": "game_ended",
                            "data": { "leaderboard": leaderboard, "winner": winner }
                        }).to_string();
                        if let Some(room) = rooms.get(rc) {
                            room.broadcast_all(&end_msg);
                        }
                    } else {
                        let next_q = rooms.get(rc).and_then(|r| r.questions.get(next_idx).cloned());
                        if let Some(q) = next_q {
                            if let Some(mut room) = rooms.get_mut(rc) {
                                room.current_question_index = next_idx;
                                room.question_start_time = Some(current_timestamp_ms());
                                room.answers_received.clear();
                            }

                            let question_json = build_question_json(&q, false);
                            let msg = json!({
                                "event": "next_question",
                                "data": {
                                    "question": question_json,
                                    "timer": q.time_limit,
                                    "question_number": next_idx + 1,
                                    "total_questions": total
                                }
                            }).to_string();

                            if let Some(room) = rooms.get(rc) {
                                room.broadcast_all(&msg);
                            }
                        }
                    }
                }
            }

            ClientEvent::HostEndGame => {
                if !is_host { continue; }
                if let Some(rc) = &room_code {
                    if let Some(mut room) = rooms.get_mut(rc) {
                        room.status = crate::game::room::RoomStatus::Finished;
                    }
                    sqlx::query("UPDATE game_rooms SET status = 'finished', ended_at = $1 WHERE room_code = $2")
                        .bind(Utc::now())
                        .bind(rc)
                        .execute(&pool)
                        .await.ok();

                    let leaderboard: Vec<Value> = rooms.get(rc).map(|r| {
                        r.get_leaderboard().iter().map(|p| json!({"id": p.id, "nickname": p.nickname, "score": p.score})).collect()
                    }).unwrap_or_default();

                    let winner = leaderboard.first().cloned();
                    let end_msg = json!({
                        "event": "game_ended",
                        "data": { "leaderboard": leaderboard, "winner": winner }
                    }).to_string();
                    if let Some(room) = rooms.get(rc) {
                        room.broadcast_all(&end_msg);
                    }
                }
            }

            ClientEvent::Ping => {
                let _ = tx_clone.send(Message::Text(json!({"event": "pong"}).to_string().into()));
            }
        }
    }

    // Cleanup on disconnect
    if let Some(rc) = &room_code {
        if let Some(pid) = &player_id {
            if let Some(mut room) = rooms.get_mut(rc) {
                room.remove_player(pid);
                let players_json: Vec<Value> = room.get_player_summaries()
                    .iter()
                    .map(|p| json!({"id": p.id, "nickname": p.nickname, "score": p.score}))
                    .collect();
                let msg = json!({
                    "event": "player_left",
                    "data": { "players": players_json }
                }).to_string();
                room.send_to_host(&msg);
            }
            sqlx::query("UPDATE game_players SET is_connected = false WHERE id = $1")
                .bind(pid)
                .execute(&pool)
                .await.ok();
        }
        if is_host {
            if let Some(mut room) = rooms.get_mut(rc) {
                room.host_sender = None;
            }
        }
    }

    send_task.abort();
}

fn build_question_json(q: &crate::models::QuestionWithAnswers, include_correct: bool) -> Value {
    let answers: Vec<Value> = q.answers.iter().map(|a| {
        let mut obj = json!({
            "id": a.id,
            "text": a.text,
            "order_index": a.order_index
        });
        if include_correct {
            obj["is_correct"] = json!(a.is_correct);
        }
        obj
    }).collect();

    json!({
        "id": q.id,
        "text": q.text,
        "image_url": q.image_url,
        "time_limit": q.time_limit,
        "points": q.points,
        "order_index": q.order_index,
        "answers": answers
    })
}
