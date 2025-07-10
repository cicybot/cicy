// shared_state.rs

use std::collections::{HashMap, HashSet};
use std::sync::Arc;
use tokio::sync::{broadcast, RwLock, oneshot};
use uuid::Uuid;
use serde_json::{json, Value};
use tokio::time::{timeout, Duration};

#[derive(Debug, Clone)]
pub struct ResponseTracker {
    pending_responses: Arc<RwLock<HashMap<String, oneshot::Sender<Value>>>>,
}

impl ResponseTracker {
    pub fn new() -> Self {
        ResponseTracker {
            pending_responses: Arc::new(RwLock::new(HashMap::new())),
        }
    }
    #[allow(dead_code)]
    pub async fn wait_for_response(
        &self,
        message_id: &str,
        wait_time: Duration,
    ) -> Result<Value, String> {
        let rx = {
            let mut pending = self.pending_responses.write().await;
            #[allow(unused_variables)]
            pending.remove(message_id).map(|tx| {
                let (new_tx, new_rx) = oneshot::channel();
                pending.insert(message_id.to_string(), new_tx);
                new_rx
            })
        };

        if let Some(rx) = rx {
            match timeout(wait_time, rx).await {
                Ok(Ok(response)) => Ok(response),
                Ok(Err(_)) => Err("Response channel closed".to_string()),
                Err(_) => Err("Timeout waiting for response".to_string()),
            }
        } else {
            Err("No pending response for this message".to_string())
        }
    }

    pub async fn complete_response(&self, message_id: &str, response: Value) -> bool {
        let sender = {
            let mut pending = self.pending_responses.write().await;
            pending.remove(message_id)
        };

        if let Some(tx) = sender {
            tx.send(response).is_ok()
        } else {
            false
        }
    }

    pub async fn register_pending(&self, message_id: String) -> oneshot::Receiver<Value> {
        let (tx, rx) = oneshot::channel();
        self.pending_responses.write().await.insert(message_id, tx);
        rx
    }
}


#[derive(Debug)]
pub struct ClientManager {
    clients: RwLock<HashMap<String, broadcast::Sender<String>>>,
}

impl ClientManager {
    pub fn new() -> Self {
        ClientManager {
            clients: RwLock::new(HashMap::new()),
        }
    }

    pub async fn add_client(&self, client_id: String, tx: broadcast::Sender<String>) {
        self.clients.write().await.insert(client_id, tx);
    }

    pub async fn remove_client(&self, client_id: &str) {
        self.clients.write().await.remove(client_id);
    }

    pub async fn has_client(&self, client_id: &str) -> bool {
        self.clients.read().await.contains_key(client_id)
    }

    pub async fn get_client(&self, client_id: &str) -> Option<broadcast::Sender<String>> {
        self.clients.read().await.get(client_id).cloned()
    }

    pub async fn get_client_ids(&self) -> Vec<String> {
        self.clients.read().await.keys().cloned().collect()
    }
}

#[derive(Debug)]
pub struct AppState {
    pub client_manager: ClientManager,
    pub global_tx: broadcast::Sender<String>,
    pub response_tracker: ResponseTracker,
    pub expected_token: String,  // Add this field
    pub authenticated_clients: RwLock<HashSet<String>>, // Track logged-in clients

}

impl AppState {
    pub fn new(expected_token: String) -> Self {
        let (global_tx, _) = broadcast::channel(100);
        AppState {
            client_manager: ClientManager::new(),
            global_tx,
            response_tracker: ResponseTracker::new(),
            expected_token,  // Initialize with provided token
            authenticated_clients: RwLock::new(HashSet::new()),
        }
    }
    pub async fn authenticate_client(&self, client_id: &str) {
        self.authenticated_clients.write().await.insert(client_id.to_string());
    }

    pub async fn logout_client(&self, client_id: &str) {
        self.authenticated_clients.write().await.remove(client_id);
    }

    pub async fn is_authenticated(&self, client_id: &str) -> bool {
        self.authenticated_clients.read().await.contains(client_id)
    }
    pub async fn send_to_client(&self, client_id: &str, message: String) -> Result<(), String> {
        if let Some(client_tx) = self.client_manager.get_client(client_id).await {
            client_tx.send(message).map_err(|e| e.to_string())?;
            Ok(())
        } else {
            Err("Client not found".to_string())
        }
    }

    #[allow(dead_code)]
    pub async fn broadcast(&self, message: String) {
        let _ = self.global_tx.send(message);
    }
    pub async fn send_with_response(
        &self,
        client_id: &str,
        message: String,
        timeout_ms: u64,
    ) -> Result<Value, String> {
        // Check if client exists
        if !self.client_manager.has_client(client_id).await {
            return Err("Client not found".to_string());
        }

        // Parse the string back into Value
        let message_value: Value = match serde_json::from_str(&message) {
            Ok(v) => v,
            Err(e) => return Err(format!("Invalid message format: {}", e)),
        };

        // Generate unique message ID
        let message_id = Uuid::new_v4().to_string();

        // Register pending response
        let response_receiver = self.response_tracker.register_pending(message_id.clone()).await;

        // Prepare the full message
        let full_message = json!({
        "from": "__SERVER",
        "id": message_id,
        "action": message_value["action"],
        "payload": message_value["payload"]
    });

        // Send the message
        if let Err(e) = self.send_to_client(client_id, full_message.to_string()).await {
            self.response_tracker.pending_responses.write().await.remove(&message_id);
            return Err(e);
        }

        // Wait for response with timeout
        match timeout(
            Duration::from_millis(timeout_ms),
            response_receiver
        ).await {
            Ok(Ok(response)) => Ok(response),
            Ok(Err(_)) => Err("Response channel closed".to_string()),
            Err(_) => {
                self.response_tracker.pending_responses.write().await.remove(&message_id);
                Err("Timeout waiting for response".to_string())
            }
        }
    }

    pub async fn handle_callback(&self, message_id: &str, payload: Value) {
        self.response_tracker.complete_response(message_id, payload).await;
    }
}