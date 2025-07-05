// main.rs
use clap::{arg, Parser};
use flexi_logger::{DeferredNow, Duplicate, FileSpec, Logger, Record, WriteMode};
use log::{debug, error, info};
use std::process::Stdio;
use std::{
    fs,
    process::{exit, Command},
    thread,
};
use time::{format_description, UtcOffset};
use reqwest;

#[cfg(unix)]
use libc;
use std::env;
use std::process;
use tokio::time::{sleep, Duration};

mod file;
mod message;
mod shell;
mod utils;
mod ws_client;

const PID_FILE: &str = "daemon_connector.pid";

#[derive(Parser, Debug)]
#[command(author, version, about)]
struct Args {
    /// Run as daemon
    #[arg(short = 'd', long)]
    daemon: bool,

    /// Stop the daemon
    #[arg(long)]
    stop: bool,

    /// Run with level debug log
    #[arg(long)]
    debug: bool,

    /// app run dir
    #[arg(long, default_value = "")]
    dir: String,

    /// CC server host : ws://127.0.0.1:3101/ws
    #[arg(long, default_value = "", value_name = "WS_SERVER")]
    ws_server: String,

    /// Client ID: CONNECTOR-MAC
    #[arg(long, default_value = "", value_name = "CLIENT_ID")]
    client_id: String,

    /// Download Url
    #[arg(long, default_value = "", value_name = "DOWNLOAD_URL")]
    download_url: String,

    /// Save Path
    #[arg(long, default_value = "", value_name = "SAVE_PATH")]
    save_path: String,

    /// Config server file name, if not set ws_server , read this file
    #[arg(long, default_value = "config_id.txt", value_name = "CONFIG_ID")]
    config_id: String,

    /// Config server file name, if not set ws_server , read this file
    #[arg(long, default_value = "config_server.txt", value_name = "CONFIG_SERVER")]
    config_server: String,

    #[arg(long = "loop", hide = true)]
    loop_mode: bool,
}

fn is_loop_mode() -> bool {
    std::env::args().any(|a| a == "--loop")
}

fn run_daemon(args: &Args) {
    if fs::metadata(PID_FILE).is_ok() {
        info!("[*] Previous daemon detected. Stopping it first...");
        stop_daemon();
        thread::sleep(Duration::from_secs(1));
    }

    info!("[+] Starting daemon... cmd: {:?}", std::env::current_exe().unwrap());

    let mut command = Command::new(std::env::current_exe().unwrap());
    command.arg("--loop")
        .arg("--dir").arg(args.dir.clone())
        .arg("--ws-server").arg(args.ws_server.clone())
        .arg("--client-id").arg(args.client_id.clone())
        .stdin(Stdio::null())
        .stdout(Stdio::null())
        .stderr(Stdio::null());

    #[cfg(windows)]
    {
        use std::os::windows::process::CommandExt;
        command.creation_flags(0x08000000); // CREATE_NO_WINDOW flag
    }

    let child = match command.spawn() {
        Ok(c) => c,
        Err(e) => {
            error!("Failed to spawn daemon process: {}", e);
            return;
        }
    };

    fs::write(PID_FILE, child.id().to_string()).expect("Failed to write pid file");
    info!("[+] Daemon started with PID {}", child.id());
}

fn stop_daemon() {
    match fs::read_to_string(PID_FILE) {
        Ok(pid_str) => {
            if let Ok(pid) = pid_str.trim().parse::<u32>() {
                info!("[+] Stopping daemon with PID {}...", pid);
                #[cfg(unix)]
                unsafe {
                    libc::kill(pid as i32, libc::SIGTERM);
                }
                #[cfg(windows)]
                {
                    Command::new("taskkill")
                        .args(&["/PID", &pid.to_string(), "/F"])
                        .status()
                        .expect("Failed to stop process");
                }
                fs::remove_file(PID_FILE).ok();
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

fn custom_format(
    w: &mut dyn std::io::Write,
    now: &mut DeferredNow,
    record: &Record,
) -> std::io::Result<()> {
    let offset = UtcOffset::from_hms(8, 0, 0).unwrap();
    let east8_time = now.now().to_offset(offset);
    let ts_fmt = format_description::parse("[year]-[month]-[day] [hour]:[minute]:[second]")
        .expect("invalid format");
    let timestamp = east8_time
        .format(&ts_fmt)
        .unwrap_or_else(|_| "????-??-?? ??:??:??".into());

    let file = record
        .file()
        .map(|f| {
            std::path::Path::new(f)
                .file_name()
                .unwrap_or_default()
                .to_string_lossy()
        })
        .unwrap_or_else(|| "unknown".into());

    let pid = process::id();

    write!(
        w,
        "[{}] [{}] [{}] [{}:{}] {}",
        timestamp,
        record.level(),
        pid,
        file,
        record.line().unwrap_or(0),
        record.args()
    )
}

async fn daemon_loop(args: &Args) {
    info!("Application starting with args: {:?}", args);
    info!("WS Server: {}", args.ws_server);
    info!("Client ID: {}", args.client_id);
    info!("Config ID: {}", args.config_id);
    info!("Client Server: {}", args.config_server);
    let mut client_id = args.client_id.clone();
    let mut ws_server = args.ws_server.clone();

    if client_id.trim().is_empty() {
        client_id = match fs::read_to_string(&args.config_id) {
            Ok(s) => {
                let trimmed = s.trim();
                if trimmed.is_empty() {
                    error!("[-] Config file {} is empty", &args.config_id);
                    exit(1);
                } else {
                    trimmed.to_string()
                }
            }
            Err(e) => {
                error!("[-] Failed to read client_id from {}: {}", &args.config_id, e);
                exit(1);
            }
        };
    }

    if ws_server.trim().is_empty() {
        ws_server = match fs::read_to_string(&args.config_server) {
            Ok(s) => {
                let trimmed = s.trim();
                if trimmed.is_empty() {
                    error!("[-] Config file {} is empty", &args.config_server);
                    exit(1);
                } else {
                    trimmed.to_string()
                }
            }
            Err(e) => {
                error!("[-] Failed to read ws_server from {}: {}", &args.config_server, e);
                exit(1);
            }
        };
    }

    info!("[+] ws_server: {}", ws_server);
    info!("[+] client_id: {}", client_id);

    // Platform-specific signal handling
    #[cfg(unix)]
    let signal_handler = async {
        use tokio::signal::unix::{signal, SignalKind};
        let mut sigterm = signal(SignalKind::terminate()).expect("Cannot listen SIGTERM");
        let mut sigint = signal(SignalKind::interrupt()).expect("Cannot listen SIGINT");

        tokio::select! {
            _ = sigterm.recv() => info!("Received SIGTERM, exiting gracefully"),
            _ = sigint.recv() => info!("Received SIGINT, exiting gracefully"),
        }
    };

    #[cfg(windows)]
    let signal_handler = async {
        tokio::signal::ctrl_c()
            .await
            .expect("Failed to listen for Ctrl+C");
        info!("Received Ctrl+C, exiting gracefully");
    };

    let pid = process::id().to_string();
    let ws_server_cloned = ws_server.clone();
    let client_id_cloned = client_id.clone();
    let ws_handle = tokio::spawn(async move {
        ws_client::connect_cc_server_forever(&ws_server_cloned, &client_id_cloned).await;
    });

    tokio::select! {
        _ = signal_handler => {
            info!("Shutting down daemon_loop");
        }
        _ = async {
            loop {
                sleep(Duration::from_secs(5)).await;
                utils::get_memory_usage_cross_platform(&pid);
            }
        } => {}
    }

    ws_handle.abort();
}

fn change_to_exe_dir(dir:&str) -> std::io::Result<()> {
    if !dir.is_empty(){
        env::set_current_dir(dir)?;
    }else{
        let exe_path = env::current_exe()?;
        if let Some(exe_dir) = exe_path.parent() {
            env::set_current_dir(exe_dir)?;
        }
    }
    Ok(())
}

#[tokio::main]
async fn main() {
    let args = Args::parse();
    if let Err(e) = change_to_exe_dir(&args.dir) {
        eprintln!("Failed to change to executable directory: {}", e);
        return;
    }
    let log_level = if args.debug { "debug" } else { "info" };

    Logger::try_with_str(log_level)
        .unwrap()
        .use_utc()
        .log_to_file(
            FileSpec::default()
                .directory(".")
                .basename("run_connector")
                .suffix("log")
                .suppress_timestamp(),
        )
        .duplicate_to_stdout(Duplicate::All)
        .append()
        .write_mode(WriteMode::BufferAndFlush)
        .format(custom_format)
        .start()
        .unwrap();

    debug!("Application starting with args: {:?}", args);

    if is_loop_mode() {
        info!("[+] Daemon loop running...");
        daemon_loop(&args).await;
        exit(0);
    }

    if args.stop {
        stop_daemon();
    } else if args.daemon {
        run_daemon(&args);
    } else if !args.download_url.is_empty() && !args.save_path.is_empty() {
        let res = match reqwest::get(&args.download_url).await {
            Ok(res) => res,
            Err(e) => {
                error!("[-] Failed to send request to daemon: {}", e);
                exit(1)
            }
        };

        info!("Response: {:?} {}", res.version(), res.status());
        info!("Headers: {:#?}\n", res.headers());

        if !res.status().is_success() {
            error!("[-] Failed to download: received status {}", res.status());
            exit(1);
        }
        if let Err(e) = fs::write(&args.save_path, res.bytes().await.unwrap()) {
            error!("[-] Failed to write to {}: {}", &args.save_path, e);
            exit(1);
        }
        info!("Saved! {:#?}\n", args.save_path);

    } else {
        daemon_loop(&args).await;
    }
}
