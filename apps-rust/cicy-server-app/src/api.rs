// src/api.rs

use axum::{
    extract::{Json, Path, State},
    http::StatusCode,
    response::IntoResponse,
};
use serde::Deserialize;

use std::sync::Arc;
use serde_json::{json, Value};

use crate::{
    utils,
    model_contact::Contact,
};

#[derive(Debug, serde::Deserialize)]
pub struct WsSendMessageRequest {
    #[serde(rename = "clientId")]  // Maps JSON "clientId" to Rust client_id
    client_id: String,
    action: String,
    payload: Value,
}

#[derive(Debug, Deserialize)]
pub struct CreateContactRequest {
    pub mobile_id: String,
    pub content: String,
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

// Add this new endpoint to your existing api.rs
pub async fn list_contacts(
    State(state): State<Arc<AppState>>
) -> Result<impl IntoResponse, impl IntoResponse> {
    match Contact::get_all(&state.db).await {
        Ok(contacts) => Ok(Json(json!({
            "err": "",
            "result": contacts
        }))),
        Err(e) => Err((
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(json!({
                "err": e.to_string(),
                "result": null
            })),
        ))
    }
}
pub async fn save_contact(
    State(state): State<Arc<AppState>>,
    Json(payload): Json<CreateContactRequest>,
) -> Result<impl IntoResponse, impl IntoResponse> {
    match Contact::upsert(&state.db, payload.mobile_id, payload.content).await {
        Ok(contact) => Ok(Json(json!({
            "err": "",
            "result": {
                "action": if contact.created_at != contact.updated_at { "updated" } else { "created" },
                "mobile_id": contact.mobile_id,
                "created_at": contact.created_at,
                "updated_at": contact.updated_at
            }
        }))),
        Err(e) => Err((
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(json!({
                "err": e.to_string(),
                "result": null
            })),
        )),
    }
}

pub async fn get_contact(
    State(state): State<Arc<AppState>>,
    Path(mobile_id): Path<String>,
) -> Result<impl IntoResponse, impl IntoResponse> {
    match Contact::get_by_mobile_id(&state.db, &mobile_id).await {
        Ok(Some(contact)) => Ok(Json(json!({
            "err": "",
            "result": contact
        }))),
        Ok(None) => Err((
            StatusCode::NOT_FOUND,
            Json(json!({
                "err": "Contact not found",
                "result": null
            })),
        )),
        Err(e) => Err((
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(json!({
                "err": e.to_string(),
                "result": null
            })),
        )),
    }
}
