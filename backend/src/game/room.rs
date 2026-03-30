use std::collections::HashMap;
use uuid::Uuid;
use axum::extract::ws::Message;
use tokio::sync::mpsc;
use crate::game::player::{Player, PlayerSummary};
use crate::models::QuestionWithAnswers;

#[derive(Debug, Clone, PartialEq)]
pub enum RoomStatus {
    Waiting,
    Active,
    Finished,
}

#[derive(Debug)]
pub struct GameRoom {
    pub id: Uuid,
    pub room_code: String,
    pub quiz_id: Uuid,
    pub host_id: Uuid,
    pub status: RoomStatus,
    pub players: HashMap<Uuid, Player>,
    pub questions: Vec<QuestionWithAnswers>,
    pub current_question_index: usize,
    pub question_start_time: Option<i64>,
    pub host_sender: Option<mpsc::UnboundedSender<Message>>,
    pub answers_received: HashMap<Uuid, bool>,
}

impl GameRoom {
    pub fn new(id: Uuid, room_code: String, quiz_id: Uuid, host_id: Uuid) -> Self {
        Self {
            id,
            room_code,
            quiz_id,
            host_id,
            status: RoomStatus::Waiting,
            players: HashMap::new(),
            questions: Vec::new(),
            current_question_index: 0,
            question_start_time: None,
            host_sender: None,
            answers_received: HashMap::new(),
        }
    }

    pub fn add_player(&mut self, player: Player) {
        self.players.insert(player.id, player);
    }

    pub fn remove_player(&mut self, player_id: &Uuid) {
        if let Some(player) = self.players.get_mut(player_id) {
            player.is_connected = false;
            player.sender = None;
        }
    }

    pub fn get_player_summaries(&self) -> Vec<PlayerSummary> {
        let mut summaries: Vec<PlayerSummary> = self.players.values()
            .filter(|p| p.is_connected)
            .map(|p| p.into())
            .collect();
        summaries.sort_by(|a, b| b.score.cmp(&a.score));
        summaries
    }

    pub fn get_leaderboard(&self) -> Vec<PlayerSummary> {
        let mut summaries: Vec<PlayerSummary> = self.players.values()
            .map(|p| p.into())
            .collect();
        summaries.sort_by(|a, b| b.score.cmp(&a.score));
        summaries
    }

    pub fn broadcast_to_players(&self, msg: &str) {
        for player in self.players.values() {
            if player.is_connected {
                player.send(Message::Text(msg.to_string().into()));
            }
        }
    }

    pub fn send_to_host(&self, msg: &str) {
        if let Some(sender) = &self.host_sender {
            let _ = sender.send(Message::Text(msg.to_string().into()));
        }
    }

    pub fn broadcast_all(&self, msg: &str) {
        self.broadcast_to_players(msg);
        self.send_to_host(msg);
    }

    pub fn current_question(&self) -> Option<&QuestionWithAnswers> {
        self.questions.get(self.current_question_index)
    }

    pub fn all_answered(&self) -> bool {
        let connected_count = self.players.values().filter(|p| p.is_connected).count();
        if connected_count == 0 { return false; }
        self.answers_received.len() >= connected_count
    }
}
