use log::{error, info};
use std::process::Command;

use std::net::{IpAddr};
use pnet::datalink;

pub fn get_local_ip_address() -> Option<(String, String)> {
    let interfaces = datalink::interfaces();

    for interface in interfaces {
        // Skip loopback and inactive interfaces
        if interface.is_loopback() || !interface.is_up() {
            continue;
        }

        // Check for IPv4 addresses
        for ip_network in interface.ips {
            if ip_network.is_ipv4() {
                let ip = ip_network.ip();
                if let IpAddr::V4(ipv4) = ip {
                    // Platform-specific considerations
                    #[cfg(target_os = "windows")]
                    let is_valid = !ipv4.is_loopback()
                        && !ipv4.is_link_local()
                        && !ipv4.is_private();

                    #[cfg(target_os = "macos")]
                    let is_valid = !ipv4.is_loopback()
                        && !ipv4.is_link_local();

                    // On macOS we often want the private IP (like 192.168.x.x)
                    // On Windows we typically want the public IP
                    if is_valid {
                        return Some((
                            ipv4.to_string(),
                            interface.name.clone()
                        ));
                    }
                }
            }
        }
    }

    // Fallback for cases where no "public" IP is found
    for interface in datalink::interfaces() {
        for ip_network in interface.ips {
            if ip_network.is_ipv4() {
                if let IpAddr::V4(ipv4) = ip_network.ip() {
                    if !ipv4.is_loopback() {
                        return Some((
                            ipv4.to_string(),
                            interface.name.clone()
                        ));
                    }
                }
            }
        }
    }

    None
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
        let output = Command::new("ps").args(["-o", "rss=", "-p", pid]).output();

        match output {
            Ok(out) => {
                if out.status.success() {
                    let mem_kb = String::from_utf8_lossy(&out.stdout).trim().to_string();
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

#[cfg(not(target_os = "windows"))]
pub fn get_memory_usage_cross_platform(pid: &str) {
    get_memory_usage(pid);
}


#[cfg(test)]
mod tests {
    use super::*;
    use std::net::Ipv4Addr;

    #[test]
    fn test_get_local_ip_returns_valid_ip() {
        if let Some((ip, interface)) = get_local_ip_address() {
            // Verify the IP address is valid
            assert!(ip.parse::<Ipv4Addr>().is_ok(), "Returned IP is not a valid IPv4 address");

            // Verify interface name is not empty
            assert!(!interface.is_empty(), "Interface name should not be empty");

            println!("Found IP: {} on interface: {}", ip, interface);
        } else {
            panic!("No IP address found - are you connected to a network?");
        }
    }

    #[test]
    fn test_ips_are_not_loopback() {
        if let Some((ip, _)) = get_local_ip_address() {
            let ip_addr: Ipv4Addr = ip.parse().unwrap();
            assert!(!ip_addr.is_loopback(), "Should not return loopback address");
        }
    }

    #[cfg(target_os = "windows")]
    #[test]
    fn test_windows_specific_checks() {
        if let Some((ip, _)) = get_local_ip_address() {
            let ip_addr: Ipv4Addr = ip.parse().unwrap();
            assert!(!ip_addr.is_link_local(), "Windows should not return link-local address");
        }
    }

    #[cfg(target_os = "macos")]
    #[test]
    fn test_macos_accepts_private_ips() {
        let result = get_local_ip_address();
        assert!(result.is_some(), "macOS should typically find an IP");

        if let Some((ip, _)) = result {
            let ip_addr: Ipv4Addr = ip.parse().unwrap();
            // macOS often uses private IPs like 192.168.x.x
            assert!(ip_addr.is_private() || !ip_addr.is_link_local(),
                    "macOS should return either private or non-link-local IP");
        }
    }

    // Test the fallback behavior by mocking network interfaces
    // This requires more advanced testing with mock interfaces
    // For now we just verify the function doesn't panic
    #[test]
    fn test_function_doesnt_panic() {
        let _ = get_local_ip_address();
    }
}
