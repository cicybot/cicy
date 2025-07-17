
use std::process::{Command};
use log::{info, error};
use regex::Regex;
use crate::shell;

pub fn get_local_ip_address() -> String {
    let cmd = if cfg!(target_os = "windows") {
        "ipconfig"
    }else{
        "ifconfig"
    };

    let output = match shell::exec_cmd(cmd) {
        Ok(output) => output,
        Err(_) => return String::new(),
    };
    // Match IPv4 addresses after "inet" but filter out unwanted ones later
    let re = Regex::new(r"\b([0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3})").unwrap();

    let mut ips = Vec::new();

    for line in output.lines() {
        let line = line.trim();
        if cfg!(target_os = "windows") && !line.starts_with("IPv4") {
            continue;
        }

        if let Some(caps) = re.captures(line) {
            if let Some(ip_match) = caps.get(1) {
                let ip = ip_match.as_str();
                if
                !ip.ends_with(".255") &&
                    !ip.ends_with(".0")
                {
                    ips.push(ip.to_string());
                }
            }
        }
    }

    ips.join(",")
}

pub fn is_android_linux() -> bool {
    std::env::var("ANDROID_ASSETS").is_ok()
}

#[cfg(target_os = "windows")]
fn get_memory_usage_win(pid: &str) {
    let output = Command::new("tasklist")
        .args(["/FI", &format!("PID eq {}", pid), "/FO", "CSV", "/NH"])
        .output();

    match output {
        Ok(out) => {
            if out.status.success() {
                let result = String::from_utf8_lossy(&out.stdout);
                if let Some(line) = result.lines().next() {
                    let parts: Vec<&str> = line.split(',').collect();
                    if parts.len() >= 5 {
                        let mem_raw = parts[4].replace('"', "").replace(" K", "").replace(",", "");
                        info!("[{}] Memory usage: {} KB", pid, mem_raw.trim());
                    } else {
                        error!("Unexpected tasklist output: {}", line);
                    }
                } else {
                    error!("No tasklist output");
                }
            } else {
                error!("tasklist failed: {:?}", out.stderr);
            }
        }
        Err(e) => error!("Failed to run tasklist: {}", e),
    }
}
#[allow(dead_code)]
#[cfg(not(target_os = "windows"))]
fn get_memory_usage(pid: &str) {
    if is_android_linux() {
        let output = Command::new("cat")
            .arg(format!("/proc/{}/status", pid))
            .output();

        match output {
            Ok(out) => {
                if out.status.success() {
                    let content = String::from_utf8_lossy(&out.stdout);
                    for line in content.lines() {
                        if line.starts_with("VmRSS:") {
                            info!("[{}] Memory usage: {}", pid, line.trim());
                            return;
                        }
                    }
                    error!("VmRSS not found in /proc/{}/status", pid);
                } else {
                    error!("cat /proc failed: {:?}", out.stderr);
                }
            }
            Err(e) => error!("Failed to read /proc: {}", e),
        }
    } else {
        // macOS / Linux
        let output = Command::new("ps")
            .args(["-o", "rss=", "-p", pid])
            .output();

        match output {
            Ok(out) => {
                if out.status.success() {
                    let mem_kb = String::from_utf8_lossy(&out.stdout)
                        .trim()
                        .to_string();
                    info!("[{}] Memory usage: {} KB", pid, mem_kb);
                } else {
                    error!("ps command failed: {:?}", out.stderr);
                }
            }
            Err(e) => error!("Failed to run ps: {}", e),
        }
    }
}

#[cfg(target_os = "windows")]
pub fn get_memory_usage_cross_platform(pid: &str) {
    get_memory_usage_win(pid);
}
#[allow(dead_code)]
#[cfg(not(target_os = "windows"))]
pub fn get_memory_usage_cross_platform(pid: &str) {
    get_memory_usage(pid);
}