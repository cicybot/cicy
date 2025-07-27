use log::{error, info};
use std::process::Stdio;
use std::{fs, process::{Command}, thread};
use tokio::time::{Duration};

pub(crate) fn stop_daemon_name(name:String) {
    stop_daemon(get_pid_file(name.as_str()))
}

pub(crate) fn stop_daemon(pid_file:String) {
    info!("[+] stop_daemon pid_file {}...", pid_file);
    match fs::read_to_string(pid_file.as_str()) {
        Ok(pid_str) => {
            if let Ok(pid) = pid_str.trim().parse::<i32>() {
                info!("[+] Stopping daemon with PID {}...", pid);
                #[cfg(unix)]
                unsafe {
                    libc::kill(pid, libc::SIGTERM);
                }
                #[cfg(windows)]
                {
                    Command::new("taskkill")
                        .args(&["/PID", &pid.to_string(), "/F"])
                        .status()
                        .expect("Failed to stop process");
                }
                fs::remove_file(pid_file.as_str()).ok();
                info!("[+] Daemon stopped.");
            } else {
                error!("[-] Invalid PID file");
            }
        }
        Err(_) => {
            error!("[-] Daemon not running (no PID file)");
        }
    }
}

pub(crate) fn get_pid_file(pid_name:&str) -> String {
    return format!("daemon-{}.pid", pid_name );
}

pub(crate) fn run_daemon(cmd:&str, pid_name:&str) {
    let parts: Vec<&str> = cmd.split_whitespace().collect();
    let (program, args) = parts.split_first().expect("Empty command");
    let pid_file = get_pid_file(pid_name).clone();
    if fs::metadata(pid_file.clone()).is_ok() {
        info!("[*] Previous daemon detected. Stopping it first...");
        stop_daemon(pid_file.clone());
        thread::sleep(Duration::from_secs(1));
    }

    info!("[+] Starting daemon... {:?}", program);
    info!("[+] args: {:#?}", args);

    let child = match Command::new(program)
        .args(args)
        .stdin(Stdio::piped())
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .spawn()
    {
        Ok(c) => c,
        Err(e) => {
            error!("Failed to spawn daemon process: {}", e);
            return;
        }
    };

    fs::write(pid_file, child.id().to_string()).expect("Failed to write pid file");
    info!("[+] Daemon started with PID {}", child.id());
}