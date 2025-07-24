use crate::debug;
use std::process::{Command, Stdio};
use encoding_rs;

pub fn exec_cmd(command: &str) -> Result<String, Box<dyn std::error::Error>> {
    let output_bytes = exec_cmd_raw(command)?;

    // First try UTF-8 (common case)
    if let Ok(utf8_str) = String::from_utf8(output_bytes.clone()) {
        return Ok(utf8_str.trim().to_string());
    }

    // Fall back to GB18030 for Chinese output (like LDPlayer)
    let (decoded, _encoding, had_errors) = encoding_rs::GB18030.decode(&output_bytes);
    if !had_errors {
        return Ok(decoded.trim().to_string());
    }

    // Final fallback to lossy UTF-8 conversion
    Ok(String::from_utf8_lossy(&output_bytes).trim().to_string())
}

pub fn exec_cmd_raw(command: &str) -> Result<Vec<u8>, Box<dyn std::error::Error>> {
    let parts: Vec<&str> = command.split_whitespace().collect();
    let (program, args) = parts.split_first().expect("Empty command");
    debug!("exec_cmd_raw: {}", command);

    let output = Command::new(program)
        .args(args)
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .output()?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        Err(stderr.trim().to_string().into())
    } else {
        Ok(output.stdout)
    }
}
#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_exec_cmd() {
        let output = exec_cmd("ldcons1ole list").unwrap();
        println!("LDPlayer instances:\n{}", output);
    }
}
