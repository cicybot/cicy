use std::process::{Command};
use serde_json::{Value};
use crate::utils::is_android_linux;

pub fn get_device_info() -> serde_json::Value {

    let script = r#"
        echo clientId:ADR-$(getprop ro.product.brand)-$(getprop ro.product.model)
        echo size:$(wm size)
        echo dpi:$(wm density)
        echo brand:$(getprop ro.product.brand)
        echo model:$(getprop ro.product.model)
        echo abi:$(getprop ro.product.cpu.abi)
        echo ipAddress:$(ifconfig | grep 'inet addr' | grep Bcast | awk '{print $2}')
        echo serverUrl:$(cat /data/local/tmp/config_server.txt 2>/dev/null)
        echo isRoot:$(ls //system/bin/su 2>/dev/null)
        echo ccAgentAppInstalled:$(pm list packages | grep com.cc.agent.adr)
        echo ccAgentAppRunning:$(pidof com.cc.agent.adr)
        echo ccAgentAppUploaded:$(ls /data/local/tmp/app.apk 2>/dev/null)
        echo ccAgentRustPid:$(cat /data/local/tmp/daemon.pid 2>/dev/null)
        echo ccAgentMediaProjection:$(dumpsys media_projection | grep com.cc.agent.adr)
        echo ccAgentAccessibility:$(settings get secure enabled_accessibility_services | grep com.web3desk.adr.InputService)
    "#;

    let output = if is_android_linux() {
        Command::new("sh")
            .args(["-c", script])
            .output()
            .expect("failed to execute local shell")
    } else {
        Command::new("adb")
            .args(["shell", script])
            .output()
            .expect("failed to execute adb shell")
    };

    let result = String::from_utf8_lossy(&output.stdout);

    let mut map = serde_json::Map::new();

    for line in result.lines() {
        if let Some((key, value)) = line.trim().split_once(':') {
            let clean_value = match key.to_string().as_str() {
                "size" => value.trim().strip_prefix("Physical size: ").unwrap_or(value.trim()).to_string(),
                "dpi" => value.trim().strip_prefix("Physical density: ").unwrap_or(value.trim()).to_string(),
                "ipAddress" => value.trim().strip_prefix("addr:").unwrap_or(value.trim()).to_string(),
                _ => value.trim().to_string(),
            };
            map.insert(key.to_string(), serde_json::Value::String(clean_value));
        }
    }

        // Now convert specific keys to bool
        for key in &["ccAgentAppInstalled","isRoot","ccAgentMediaProjection", "ccAgentAppRunning", "ccAgentAccessibility","ccAgentAppUploaded"] {
        if let Some(value) = map.get(*key) {
            let is_true = match value {
                serde_json::Value::String(s) => !s.is_empty(),
                _ => false,
            };
            map.insert(key.to_string(), serde_json::Value::Bool(is_true));
        }
    }
    map.insert(
        "agentRustVersion".to_string(),
        Value::String(env!("CARGO_PKG_VERSION").to_string()),
    );

    serde_json::Value::Object(map)
}


pub fn get_device_info_min() -> serde_json::Value {
    let script = r#"
        echo clientId:ADR-$(getprop ro.product.brand)-$(getprop ro.product.model)
        echo ccAgentAppRunning:$(pidof com.cc.agent.adr)
        echo ipAddress:$(ifconfig | grep 'inet addr' | grep Bcast | awk '{print $2}')
        echo ccAgentMediaProjection:$(dumpsys media_projection | grep com.cc.agent.adr)
        echo ccAgentAccessibility:$(settings get secure enabled_accessibility_services | grep com.web3desk.adr.InputService)
    "#;

    let output = if is_android_linux() {
        Command::new("sh")
            .args(["-c", script])
            .output()
            .expect("failed to execute local shell")
    } else {
        Command::new("adb")
            .args(["shell", script])
            .output()
            .expect("failed to execute adb shell")
    };


    let result = String::from_utf8_lossy(&output.stdout);

    let mut map = serde_json::Map::new();

    for line in result.lines() {
        if let Some((key, value)) = line.trim().split_once(':') {
            let clean_value = match key.to_string().as_str() {
                "ipAddress" => value.trim().strip_prefix("addr:").unwrap_or(value.trim()).to_string(),
                "ccAgentAppHttpServer" => value.trim().strip_prefix("*:").unwrap_or(value.trim()).to_string(),
                _ => value.trim().to_string(),
            };
            map.insert(key.to_string(), serde_json::Value::String(clean_value));
        }
    }

    // Now convert specific keys to bool
    for key in &["ccAgentAppRunning","ccAgentMediaProjection","ccAgentAccessibility"] {
        if let Some(value) = map.get(*key) {
            let is_true = match value {
                serde_json::Value::String(s) => !s.is_empty(),
                _ => false,
            };
            map.insert(key.to_string(), serde_json::Value::Bool(is_true));
        }
    }
    serde_json::Value::Object(map)
}


#[cfg(test)]
mod tests {
    use super::*;
    #[tokio::test]
    async fn test_jsonrpc_ping() {
        let json = get_device_info();
        println!("{}", serde_json::to_string_pretty(&json).unwrap());
    }


}