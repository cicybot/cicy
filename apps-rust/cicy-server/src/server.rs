// src/server.rs
use axum::{
    extract::Path,
    http::{header, StatusCode},
    response::{Response, IntoResponse},
    routing::post,
    routing::get,
    Router,
    body::Body,
};
use include_dir::{Dir, include_dir};
use mime_guess::from_path;
use std::sync::Arc;
use axum::http::HeaderMap;
use tower_http::{
    compression::CompressionLayer,
    set_header::SetResponseHeaderLayer,
    trace::TraceLayer,
};
use tracing::error;
use crate::shared_state::AppState;
use crate::swagger::{openapi_spec, swagger_ui};

static STATIC_DIR: Dir<'static> = include_dir!("$CARGO_MANIFEST_DIR/public");

pub fn create_app(state: Arc<AppState>,assets_dir:&str) -> Router {

    Router::new()
        // API endpoints
        .route("/api/health", get(crate::api::health_check))
        .route("/api/ws/info", get(crate::api::ws_info))
        .route("/api/ws/sendMsg", post(crate::api::ws_send_msg))
        .route("/api/ws/broadcastMsg", get(crate::api::broadcast_msg))
        // Swagger UI 页面
        .route("/doc", get(swagger_ui))
        // OpenAPI 规范端点
        .route("/openapi.json", get(openapi_spec))
        // WebSocket endpoint
        .route("/ws", get(crate::websocket::websocket_handler))

        // Static file routes
        .route("/", get(serve_index))
        .route("/index.html", get(serve_index))
        .route("/static/assets/*path", get({
            let use_embedded = assets_dir.is_empty();
            let assets_dir = assets_dir.to_string();
            move |path| {
                let assets_dir = assets_dir.clone();
                async move {
                    if use_embedded {
                        serve_static_assets_file_embedded(path).await.into_response()
                    } else {
                        serve_static_assets_file_fs(path, assets_dir).await.into_response()
                    }
                }
            }
        }))
        .route("/*path", get(serve_static_file))

        // Apply middleware
        .fallback(handler_404)
        .layer(
            TraceLayer::new_for_http()
                .make_span_with(|req: &axum::http::Request<_>| {
                    tracing::info_span!("request", method = %req.method(), uri = %req.uri())
                }),
        )
        .with_state(state)
}


async fn serve_static_assets_file_embedded(Path(path): Path<String>) -> impl IntoResponse {
    let safe_path = path.trim_start_matches('/').replace("//", "/");
    match STATIC_DIR.get_file(&safe_path) {
        Some(file) => {
            let mime_type = from_path(&safe_path).first_or_octet_stream();
            Response::builder()
                .status(StatusCode::OK)
                .header(header::CONTENT_TYPE, mime_type.as_ref())
                .body(Body::from(file.contents()))
                .unwrap_or_else(|_| {
                    (StatusCode::INTERNAL_SERVER_ERROR, "Internal Server Error").into_response()
                })
        }
        None => {
            error!("Embedded asset not found: {}", safe_path);
            (StatusCode::NOT_FOUND, "Embedded asset not found").into_response()
        }
    }
}

async fn serve_static_assets_file_fs(Path(path): Path<String>, assets_dir: String) -> Response {
    let mut safe_path = std::path::PathBuf::new();
    for part in std::path::Path::new(&path).components() {
        if let std::path::Component::Normal(p) = part {
            safe_path.push(p);
        }
    }

    let full_path = std::path::PathBuf::from(&assets_dir).join(safe_path);

    match tokio::fs::read(&full_path).await {
        Ok(content) => {
            let mime_type = from_path(&full_path).first_or_octet_stream();
            Response::builder()
                .status(StatusCode::OK)
                .header(header::CONTENT_TYPE, mime_type.as_ref())
                .body(Body::from(content))
                .unwrap_or_else(|_| {
                    (StatusCode::INTERNAL_SERVER_ERROR, "Internal Server Error").into_response()
                })
        }
        Err(err) => {
            error!("Filesystem asset not found: {}: {}", full_path.display(), err);
            (StatusCode::NOT_FOUND, "Filesystem asset not found").into_response()
        }
    }
}
async fn serve_index() -> impl IntoResponse {
    match STATIC_DIR.get_file("index.html") {
        Some(file) => {
            let mut headers = HeaderMap::new();
            headers.insert(
                header::CACHE_CONTROL,
                header::HeaderValue::from_static("no-store, no-cache, must-revalidate"),
            );
            headers.insert(
                header::PRAGMA,
                header::HeaderValue::from_static("no-cache"),
            );
            headers.insert(
                header::EXPIRES,
                header::HeaderValue::from_static("0"),
            );
            headers.insert(
                header::CONTENT_TYPE,
                header::HeaderValue::from_static("text/html"),
            );

            (headers, file.contents()).into_response()
        }
        None => {
            error!("index.html not found");
            (StatusCode::NOT_FOUND, "Not Found").into_response()
        }
    }
}
// Handle static file requests
async fn serve_static_file(Path(path): Path<String>) -> impl IntoResponse {
    let requested_path = path.trim_matches('/').replace("//", "/");
    serve_file(&requested_path).await
}

// Core file serving function
async fn serve_file(path: &str) -> impl IntoResponse {
    let requested_path = if path.is_empty() { "index.html" } else { path };

    match STATIC_DIR.get_file(requested_path) {
        Some(file) => {
            let mime_type = from_path(requested_path).first_or_octet_stream();
            Response::builder()
                .status(StatusCode::OK)
                .header(header::CONTENT_TYPE, mime_type.as_ref())
                .body(Body::from(file.contents()))
                .map_err(|_| (StatusCode::INTERNAL_SERVER_ERROR, "Internal Server Error"))
        }
        None => {
            error!("File not found: {}", requested_path);
            Err((StatusCode::NOT_FOUND, "Not Found"))
        }
    }
}

// 404 handler
async fn handler_404() -> impl IntoResponse {
    (StatusCode::NOT_FOUND, "Not Found")
}