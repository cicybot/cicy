use crate::debug;
use std::process::{Command, Stdio};

pub fn exec_cmd(command: &str) -> Result<String, Box<dyn std::error::Error>> {
    let parts: Vec<&str> = command.split_whitespace().collect();
    let (program, args) = parts.split_first().expect("Empty command");
    debug!("exec_cmd: {}", command);
    let output = Command::new(program)
        .args(args)
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .output()?;
    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        Err(stderr.trim().to_string().into())
    } else {
        Ok(String::from_utf8_lossy(&output.stdout).trim().to_string())
    }
}
