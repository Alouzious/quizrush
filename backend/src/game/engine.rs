use std::time::{SystemTime, UNIX_EPOCH};

pub fn calculate_score(is_correct: bool, time_limit_secs: i32, response_time_ms: i64, max_points: i32) -> i32 {
    if !is_correct {
        return 0;
    }
    let time_limit_ms = (time_limit_secs as i64) * 1000;
    let elapsed = response_time_ms.min(time_limit_ms);
    let ratio = 1.0 - (elapsed as f64 / time_limit_ms as f64) * 0.5;
    let score = (max_points as f64 * ratio).round() as i32;
    score.max(max_points / 2).min(max_points)
}

pub fn current_timestamp_ms() -> i64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default()
        .as_millis() as i64
}

pub fn generate_room_code() -> String {
    use rand::Rng;
    let mut rng = rand::thread_rng();
    (0..6)
        .map(|_| {
            let idx = rng.gen_range(0..36u8);
            if idx < 10 {
                (b'0' + idx) as char
            } else {
                (b'A' + idx - 10) as char
            }
        })
        .collect()
}
