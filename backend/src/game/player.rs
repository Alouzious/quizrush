use serde::{Deserialize, Serialize};
use uuid::Uuid;
use axum::extract::ws::Message;
use tokio::sync::mpsc;

#[derive(Debug, Clone)]
pub struct Player {
    pub id: Uuid,
    pub nickname: String,
    pub score: i32,
    pub is_connected: bool,
    pub sender: Option<mpsc::UnboundedSender<Message>>,
}

impl Player {
    pub fn new(id: Uuid, nickname: String, sender: mpsc::UnboundedSender<Message>) -> Self {
        Self {
            id,
            nickname,
            score: 0,
            is_connected: true,
            sender: Some(sender),
        }
    }

    pub fn send(&self, msg: Message) {
        if let Some(sender) = &self.sender {
            let _ = sender.send(msg);
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PlayerSummary {
    pub id: Uuid,
    pub nickname: String,
    pub score: i32,
}

impl From<&Player> for PlayerSummary {
    fn from(p: &Player) -> Self {
        PlayerSummary {
            id: p.id,
            nickname: p.nickname.clone(),
            score: p.score,
        }
    }
}
