use std::env::current_exe;
use tokio::net::{TcpListener, TcpStream};
use tokio::io::{AsyncReadExt, AsyncWriteExt};
use serde::{Deserialize, Serialize};
use log::{info, error};
use crate::{device, shell,file};
use serde_json::json;
use tokio::fs::File;

#[derive(Deserialize)]
struct JsonRpcRequest {
    #[allow(dead_code)]
    jsonrpc: String,
    method: String,
    #[allow(dead_code)]
    params: Option<serde_json::Value>,
    #[allow(dead_code)]
    id: Option<serde_json::Value>,
}


#[derive(Serialize)]
struct JsonRpcResponse {
    jsonrpc: String,

    #[serde(skip_serializing_if = "Option::is_none")]
    err: Option<String>,

    result: serde_json::Value,
    id: Option<serde_json::Value>,
}

impl JsonRpcResponse {
    fn success(result: serde_json::Value, id: Option<serde_json::Value>) -> Self {
        JsonRpcResponse {
            jsonrpc: "2.0".to_string(),
            err: None,
            result,
            id,
        }
    }

    fn error(message: &str, id: Option<serde_json::Value>) -> Self {
        JsonRpcResponse {
            jsonrpc: "2.0".to_string(),
            err: Some(message.to_string()),
            result: serde_json::Value::Null,
            id,
        }
    }
}

pub async fn write_bytes_response(
    socket: &mut tokio::net::TcpStream,
    file_path: &std::path::Path,
    content_type: &str,
    status: &str, // e.g., "200 OK"
) -> tokio::io::Result<()> {
    // Try to open the file
    let mut file = match File::open(file_path).await {
        Ok(file) => file,
        Err(e) => {
            // If file can't be opened, write error headers first
            let error_response = format!(
                "HTTP/1.1 500 Internal Server Error\r\n\
                 Content-Type: application/json\r\n\
                 Connection: close\r\n\r\n\
                 {{\"error\":\"Failed to open file: {}\"}}",
                e
            );
            return socket.write_all(error_response.as_bytes()).await;
        }
    };

    // Get file metadata for Content-Length
    let metadata = match file.metadata().await {
        Ok(meta) => meta,
        Err(e) => {
            let error_response = format!(
                "HTTP/1.1 500 Internal Server Error\r\n\
                 Content-Type: application/json\r\n\
                 Connection: close\r\n\r\n\
                 {{\"error\":\"Failed to get file metadata: {}\"}}",
                e
            );
            return socket.write_all(error_response.as_bytes()).await;
        }
    };

    // Write headers
    let headers = format!(
        "HTTP/1.1 {}\r\n\
         Content-Type: {}\r\n\
         Access-Control-Allow-Origin: *\r\n\
         Access-Control-Allow-Methods: GET, POST, OPTIONS\r\n\
         Access-Control-Allow-Headers: Content-Type\r\n\
         Content-Length: {}\r\n\
         Connection: close\r\n\r\n",
        status,
        content_type,
        metadata.len()
    );

    socket.write_all(headers.as_bytes()).await?;

    // Stream the file content in chunks
    let mut buffer = [0u8; 8192]; // 8KB buffer
    loop {
        match file.read(&mut buffer).await {
            Ok(0) => break, // EOF
            Ok(n) => {
                socket.write_all(&buffer[..n]).await?;
            }
            Err(e) => {
                return Err(e);
            }
        }
    }

    Ok(())
}

pub async fn write_json_response<T: Serialize>(
    socket: &mut TcpStream,
    value: &T,
    status: &str, // e.g., "200 OK"
) -> tokio::io::Result<()> {
    let body = serde_json::to_string(value).unwrap_or_else(|_| "{}".to_string());

    let response = format!(
        "HTTP/1.1 {}\r\n\
        Access-Control-Allow-Origin: *\r\n\
        Access-Control-Allow-Methods: GET, POST, OPTIONS\r\n\
        Access-Control-Allow-Headers: Content-Type\r\n\
        Content-Type: application/json\r\
        nContent-Length: {}\r\n\
        Connection: close\r\n\r\n{}",
        status,
        body.len(),
        body
    );

    socket.write_all(response.as_bytes()).await
}


pub async fn run_jsonrpc_server(addr: &str) {
    let listener = TcpListener::bind(addr).await.expect("Failed to bind JSON-RPC server");
    info!("JSON-RPC server listening on {}", addr);

    loop {
        match listener.accept().await {
            Ok((mut socket, addr)) => {
                info!("Accepted connection from {}", addr);
                tokio::spawn(async move {
                    if let Err(e) = handle_connection(&mut socket).await {
                        error!("Connection error: {}", e);
                    }
                });
            }
            Err(e) => error!("Accept failed: {}", e),
        }
    }
}

async fn handle_connection(socket: &mut TcpStream) -> tokio::io::Result<()> {
    let mut buf = vec![0u8; 4096];
    let n = socket.read(&mut buf).await?;
    if n == 0 {
        return Ok(());
    }
    let req_str = String::from_utf8_lossy(&buf[..n]);

    // Check if this is an OPTIONS request (CORS preflight)
    if req_str.starts_with("OPTIONS") {
        let response = "HTTP/1.1 200 OK\r\n\
                      Access-Control-Allow-Origin: *\r\n\
                      Access-Control-Allow-Methods: GET, POST, OPTIONS\r\n\
                      Access-Control-Allow-Headers: Content-Type\r\n\
                      Content-Length: 0\r\n\
                      Connection: close\r\n\r\n";
        return socket.write_all(response.as_bytes()).await;
    }


    let url_path = req_str
        .lines()
        .next()
        .and_then(|line| line.split_whitespace().nth(1))
        .unwrap_or("/");

    info!("Parsed path: {}", url_path);
    if url_path == "/deviceInfo" {
        let resp =  JsonRpcResponse::success(device::get_device_info(), Some(json!(1)));
        write_json_response(socket, &resp, "200 OK").await?;
        Ok(())
    } else if url_path == "/screen" {
        let _ = shell::exec_cmd("screencap /data/local/tmp/screen.png");
        // Stream the file as response
        write_bytes_response(
            socket,
            std::path::Path::new("/data/local/tmp/screen.png"),
            "image/png",
            "200 OK"
        ).await?;
        Ok(())
    } else if url_path.starts_with("/file") {
        use std::path::PathBuf;
        use percent_encoding::percent_decode;
        use url::form_urlencoded::parse as parse_query;

        // Parse query parameters from the URL path
        let query_string = url_path.splitn(2, '?').nth(1).unwrap_or("");
        let mut query_params = parse_query(query_string.as_bytes());

        // Get the 'path' parameter
        let file_path = match query_params.find(|(k, _)| k == "path") {
            Some((_, v)) => {
                // Decode URL-encoded path and convert to PathBuf
                let decoded = percent_decode(v.as_bytes()).decode_utf8_lossy();
                PathBuf::from(decoded.as_ref())
            },
            None => {
                let resp = JsonRpcResponse::error(
                    "Missing 'path' parameter",
                    Some(json!(1)),
                );
                write_json_response(socket, &resp, "400 Bad Request").await?;
                return Ok(());
            }
        };

        // Security checks
        if file_path.to_string_lossy().is_empty() {
            let resp = JsonRpcResponse::error(
                "Empty file path",
                Some(json!(1)),
            );
            write_json_response(socket, &resp, "400 Bad Request").await?;
            return Ok(());
        }

        // Prevent directory traversal attacks
        if file_path.components().any(|c| matches!(c, std::path::Component::ParentDir)) {
            let resp = JsonRpcResponse::error(
                "Path contains parent directory traversal",
                Some(json!(1)),
            );
            write_json_response(socket, &resp, "403 Forbidden").await?;
            return Ok(());
        }

        // Determine content type based on file extension
        let content_type = match file_path.extension().and_then(|s| s.to_str()) {
            Some("png") => "image/png",
            Some("jpg") | Some("jpeg") => "image/jpeg",
            Some("gif") => "image/gif",
            Some("pdf") => "application/pdf",
            Some("txt") => "text/plain",
            Some("json") => "application/json",
            Some("mp4") => "video/mp4",
            Some("mp3") => "audio/mpeg",
            _ => "application/octet-stream", // default for unknown types
        };

        // Stream the file
        match write_bytes_response(socket, &file_path, content_type, "200 OK").await {
            Ok(_) => Ok(()),
            Err(e) if e.kind() == std::io::ErrorKind::NotFound => {
                let resp = JsonRpcResponse::error(
                    &format!("File not found: {}", file_path.display()),
                    Some(json!(1)),
                );
                write_json_response(socket, &resp, "404 Not Found").await?;
                Ok(())
            }
            Err(e) if e.kind() == std::io::ErrorKind::PermissionDenied => {
                let resp = JsonRpcResponse::error(
                    &format!("Permission denied: {}", file_path.display()),
                    Some(json!(1)),
                );
                write_json_response(socket, &resp, "403 Forbidden").await?;
                Ok(())
            }
            Err(e) => {
                let resp = JsonRpcResponse::error(
                    &format!("Failed to read file: {}", e),
                    Some(json!(1)),
                );
                write_json_response(socket, &resp, "500 Internal Server Error").await?;
                Ok(())
            }
        }
    }else {
        let body_index = req_str.find("\r\n\r\n").unwrap_or(n);
        let body = &req_str[body_index + 4..]; // +4 跳过 \r\n\r\n
        let req: Result<JsonRpcRequest, _> = serde_json::from_str(body);
        let resp = match req {
            Ok(rpc_req) => {
                let (err, result) = handle_method_call(&rpc_req.method, &rpc_req.params);
                JsonRpcResponse {
                    jsonrpc: "2.0".to_string(),
                    err,
                    result,
                    id: rpc_req.id,
                }
            }
            Err(_) => JsonRpcResponse::error("invalid request", None),
        };
        write_json_response(socket, &resp, "200 OK").await?;
        Ok(())
    }
}

pub fn handle_method_call(method: &str, params: &Option<serde_json::Value>) -> (Option<String>, serde_json::Value) {
    match method {
        "shell" => {
            if let Some(serde_json::Value::Array(arr)) = params {
                if let Some(serde_json::Value::String(cmd)) = arr.get(0) {

                    match shell::exec_cmd(cmd) {
                        Ok(output) => (None, serde_json::json!(output)),
                        Err(e) => (
                            Some(format!("{:?}", e).to_string()),
                            serde_json::Value::Null,
                        ),
                    }
                } else {
                    (Some("First param must be string".to_string()), serde_json::Value::Null)
                }
            } else {
                (Some("Params must be an array".to_string()), serde_json::Value::Null)
            }
        }
        "readFile" => {
            if let Some(serde_json::Value::Array(arr)) = params {
                if let Some(serde_json::Value::String(file_path)) = arr.get(0) {
                    match file::get_file_content(file_path) {
                        Ok(output) => (None, serde_json::json!(output)),
                        Err(e) => (
                            Some(format!("{:?}", e).to_string()),
                            serde_json::Value::Null,
                        ),
                    }
                } else {
                    (
                        Some("First param must be string".to_string()),
                        serde_json::Value::Null,
                    )
                }
            } else {
                (
                    Some("Params must be an array".to_string()),
                    serde_json::Value::Null,
                )
            }
        }
        "writeFile" => {
            if let Some(serde_json::Value::Array(arr)) = params {
                if let Some(serde_json::Value::String(file_path)) = arr.get(0) {
                    if let Some(serde_json::Value::String(content)) = arr.get(1) {
                        match file::put_file_content(file_path, content) {
                            Ok(output) => (None, serde_json::json!(output)),
                            Err(e) => (
                                Some(format!("{:?}", e).to_string()),
                                serde_json::Value::Null,
                            ),
                        }
                    } else {
                        (
                            Some("second param must be string".to_string()),
                            serde_json::Value::Null,
                        )
                    }
                } else {
                    (
                        Some("First param must be string".to_string()),
                        serde_json::Value::Null,
                    )
                }
            } else {
                (
                    Some("Params must be an array".to_string()),
                    serde_json::Value::Null,
                )
            }
        }
        "download" => {
            if let Some(serde_json::Value::Array(arr)) = params {
                if let Some(serde_json::Value::String(url)) = arr.get(0) {
                    if let Some(serde_json::Value::String(save_path)) = arr.get(0) {
                        match shell::exec_cmd(&format!("{} --download-url {} --save-path {}",current_exe().unwrap().display(),url, save_path)) {
                            Ok(output) => (None, serde_json::json!(output)),
                            Err(e) => (
                                Some(format!("{:?}", e).to_string()),
                                serde_json::Value::Null,
                            ),
                        }
                    } else {
                        (Some("First param must be string".to_string()), serde_json::Value::Null)
                    }
                } else {
                    (Some("First param must be string".to_string()), serde_json::Value::Null)
                }
            } else {
                (Some("Params must be an array".to_string()), serde_json::Value::Null)
            }
        }
        "deviceInfo" => (None, device::get_device_info()),
        _ => (Some("Unknown method".to_string()), serde_json::Value::Null),
    }
}