// src/api.rs
use axum::{
    extract::{Json, State},
    http::StatusCode,
    response::IntoResponse,
};
use std::sync::Arc;
use serde_json::{json, Value};

use crate::{
    utils,
};

#[derive(Debug, serde::Deserialize)]
pub struct WsSendMessageRequest {
    #[serde(rename = "clientId")]  // Maps JSON "clientId" to Rust client_id
    client_id: String,
    action: String,
    payload: Value,
}

use crate::{shared_state::AppState, websocket::broadcast_message};

pub async fn health_check() -> impl IntoResponse {
    (StatusCode::OK, "API is healthy")
}

pub async fn ws_info(State(state): State<Arc<AppState>>) -> impl IntoResponse {
    let clients = state.client_manager.get_client_ids().await;
    let local_ip = utils::get_local_ip_address();
    Json(json!({
        "err": "",
        "result": {
            "clients":clients,
            "ipAddress":local_ip
        }
    }))
}

pub async fn ws_send_msg(
    State(state): State<Arc<AppState>>,
    Json(request): Json<WsSendMessageRequest>,
) -> impl IntoResponse {
    // Construct the message as a Value (don't convert to string)
    let message = json!({
        "action": request.action,
        "payload": request.payload
    });

    match state.send_with_response(&request.client_id, message.to_string(), 30000).await {
        Ok(response) => (
            StatusCode::OK,
            Json(json!({
                "err": "",
                "result": response
            })),
        ),
        Err(e) => (
            StatusCode::NOT_FOUND,
            Json(json!({
                "err": e,
                "result": null
            })),
        ),
    }
}
pub async fn broadcast_msg(State(state): State<Arc<AppState>>) -> impl IntoResponse {
    let message = "Test message from API endpoint".to_string();

    broadcast_message(&state, message.clone()).await;

    Json(json!({
        "err": "",
        "result": message
    }))
}
