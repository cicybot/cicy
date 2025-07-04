use axum::{
    extract::{
        ws::{Message, WebSocket, WebSocketUpgrade},
        Query, State,
    },
    response::IntoResponse,
};
use futures_util::{StreamExt};
use serde::Deserialize;
use serde_json::{json, Value};
use std::sync::Arc;
use tokio::sync::broadcast;
use tracing::{debug, info};

use crate::shared_state::AppState;
use crate::utils;

#[derive(Debug, Deserialize)]
pub struct ConnectionQuery {
    id: String,
    t: Option<String>,
}

pub async fn websocket_handler(
    ws: WebSocketUpgrade,
    Query(query): Query<ConnectionQuery>,
    State(state): State<Arc<AppState>>,
) -> impl IntoResponse {
    info!("WebSocket connection requested from client: {}", query.id);

    if state.client_manager.has_client(&query.id).await {
        if let Some(client_tx) = state.client_manager.get_client(&query.id).await {
            let _ = client_tx.send(
                json!({
                    "action": "close",
                    "code": 3001,
                    "reason": "WS_CLOSE_STOP_RECONNECT"
                })
                    .to_string(),
            );
        }
        state.client_manager.remove_client(&query.id).await;
    }

    ws.on_upgrade(move |socket| handle_socket(socket, state, query.id, query.t))
}
async fn handle_socket(
    mut socket: WebSocket,
    state: Arc<AppState>,
    client_id: String,
    timestamp: Option<String>,
) {
    info!("New WebSocket connection: {} {:?}", client_id, timestamp);

    // Create a broadcast channel for this client
    let (tx, _) = broadcast::channel(100);
    state.client_manager.add_client(client_id.clone(), tx.clone()).await;

    // Subscribe to the global broadcast channel
    let mut global_rx = state.global_tx.subscribe();
    // Subscribe to the client-specific broadcast channel
    let mut client_rx = tx.subscribe();

    loop {
        tokio::select! {
            // Handle incoming message from the WebSocket
            msg = socket.next() => {
                match msg {
                    Some(Ok(Message::Text(text))) => {
                        debug!("[+] [REV] {}: {}", client_id, text);
                        if let Ok(payload) = serde_json::from_str::<Value>(&text) {
                            handle_client_message(&state, &client_id, payload).await;
                        }
                    }
                    Some(Ok(Message::Close(_))) => {
                        break;
                    }
                    Some(Ok(Message::Ping(data))) => {
                        if socket.send(Message::Pong(data)).await.is_err() {
                            break;
                        }
                    }
                    Some(Err(_)) | None => {
                        break;
                    }
                    _ => {}
                }
            },
            // Handle message from the global broadcast
            msg = global_rx.recv() => {
                match msg {
                    Ok(text) => {
                        if socket.send(Message::Text(text)).await.is_err() {
                            break;
                        }
                    }
                    Err(_) => {
                        // Receiver lagged, we can ignore or break
                    }
                }
            },
            // Handle message from the client-specific broadcast
            msg = client_rx.recv() => {
                match msg {
                    Ok(text) => {
                        if socket.send(Message::Text(text)).await.is_err() {
                            break;
                        }
                    }
                    Err(_) => {
                        // Receiver lagged, we can ignore or break
                    }
                }
            }
        }
    }

    info!("Client disconnected: {} {:?}", client_id, timestamp);
    state.client_manager.remove_client(&client_id).await;
}

async fn handle_client_message(state: &Arc<AppState>, client_id: &str, payload: Value) {
    let action = payload.get("action").and_then(Value::as_str).unwrap_or("");
    let message_id = payload.get("id").and_then(Value::as_str).unwrap_or("");
    let to_client = payload.get("to").and_then(Value::as_str).unwrap_or("");
    let payload_data = payload.get("payload").cloned().unwrap_or(Value::Null);

    // Handle server callbacks first
    if to_client == "__SERVER" && action == "callback" && !message_id.is_empty() {
        state.handle_callback(message_id, payload_data).await;
        return;
    }

    match action {
        "ping" => {
            let _ = state.send_to_client(client_id,
                                         json!({"id": message_id, "action": "pong"}).to_string()
            ).await;
        }
        "__info" => {
            let local_ip = utils::get_local_ip_address()
                .map(|(ip, _)| ip)
                .unwrap_or_else(|| "127.0.0.1".to_string());

            let _ = state.send_to_client(client_id,
                                         json!({
                    "id": message_id,
                    "action": "callback",
                    "payload": {"ip": local_ip}
                }).to_string()
            ).await;
        }
        "__isOnline" => {
            let target_id = payload_data.get("clientId").and_then(Value::as_str).unwrap_or("");
            let is_online = state.client_manager.has_client(target_id).await;
            let _ = state.send_to_client(client_id,
                                         json!({
                    "id": message_id,
                    "action": "callback",
                    "payload": {"isOnline": is_online}
                }).to_string()
            ).await;
        }
        "__clients" => {
            let clients = state.client_manager.get_client_ids().await;
            let _ = state.send_to_client(client_id,
                                         json!({
                    "id": message_id,
                    "action": "callback",
                    "payload": {"clients": clients}
                }).to_string()
            ).await;
        }
        _ => {
            if !to_client.is_empty() {
                if state.client_manager.has_client(to_client).await {
                    let _ = state.send_to_client(to_client,
                                                 json!({
                            "from": client_id,
                            "id": message_id,
                            "action": action,
                            "payload": payload_data
                        }).to_string()
                    ).await;
                } else {
                    let _ = state.send_to_client(client_id,
                                                 json!({
                            "id": message_id,
                            "action": "callback",
                            "payload": {"err": "toClientId not exists"}
                        }).to_string()
                    ).await;
                }
            } else {
                let _ = state.send_to_client(client_id,
                                             json!({
                        "id": message_id,
                        "action": "callback",
                        "payload": {"err": "error request"}
                    }).to_string()
                ).await;
            }
        }
    }
}

pub async fn broadcast_message(state: &Arc<AppState>, message: String) {
    let _ = state.global_tx.send(message);
}
#[allow(dead_code)]
pub async fn send_to_client(state: &Arc<AppState>, client_id: &str, message: String) -> Result<(), String> {
    state.send_to_client(client_id, message).await
}