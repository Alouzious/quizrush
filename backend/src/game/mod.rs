pub mod engine;
pub mod player;
pub mod room;

use dashmap::DashMap;
use std::sync::Arc;
use self::room::GameRoom;

pub type RoomStore = Arc<DashMap<String, GameRoom>>;

pub fn new_room_store() -> RoomStore {
    Arc::new(DashMap::new())
}
