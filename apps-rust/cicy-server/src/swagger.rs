use axum::{
    response::{Html, Json},
};
use axum::http::{header, HeaderMap};
use axum::response::IntoResponse;
use serde_yaml::Value; // Add serde_yaml to your Cargo.toml

pub async fn openapi_spec() -> impl IntoResponse {
    let yaml_str = include_str!("./openapi.yaml");

    let yaml_value: Value = serde_yaml::from_str(yaml_str)
        .unwrap_or_else(|_| {
            // Fallback minimal OpenAPI spec
            serde_yaml::from_str(r#"
                openapi: 3.0.0
                info:
                  title: API Documentation
                  version: 1.0.0
                paths: {}
                components: {}
            "#).unwrap()
        });

    // Convert to JSON for response
    let json_value = serde_json::to_value(yaml_value).unwrap();

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
        header::HeaderValue::from_static("application/json"),
    );

    (headers, Json(json_value))
}

pub async fn swagger_ui() -> Html<&'static str> {
    Html(
        r#"
        <!DOCTYPE html>
        <html>
        <head>
            <title>Swagger UI</title>
            <meta charset="utf-8"/>
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <link rel="stylesheet" type="text/css" href="/static/swagger-ui/swagger-ui.css" />
        </head>
        <body>
            <div id="swagger-ui"></div>
            <script src="/static/swagger-ui/swagger-ui-bundle.js"></script>
            <script>
                window.onload = () => {
                    window.ui = SwaggerUIBundle({
                        url: "/openapi.json",
                        dom_id: '#swagger-ui',
                    });
                };
            </script>
        </body>
        </html>
        "#
    )
}
