// src/main.rs
mod server;
mod utils;
mod shared_state;
mod websocket;

mod api;
mod swagger;
mod model_contact;
mod sqlite;
mod aes_gcm_crypto;

use clap::Parser;
use flexi_logger::{DeferredNow, Duplicate, FileSpec, Logger, Record, WriteMode};
use log::{debug, error, info};
use std::process::Stdio;
use std::{
    fs,
    process::{exit, Command},
    thread,
};
use time::{format_description, UtcOffset};
use rand_core::{OsRng, RngCore};
use hex;
#[cfg(unix)]
use libc;
use std::env;
use std::process;
use tokio::signal::unix::SignalKind;
use tokio::time::{sleep, Duration};

use std::sync::Arc;
use crate::aes_gcm_crypto::AesGcmCrypto;

const PID_FILE: &str = "daemon.pid";

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

    /// Server IP address to bind to
    #[arg(long, default_value = "0.0.0.0")]
    ip: String,

    /// Server port to listen on
    #[arg(long, default_value = "3101")]
    port: u16,

    #[arg(long = "loop", hide = true)]
    loop_mode: bool,


    #[arg(long)]
    gen_key: bool,
}

fn is_loop_mode() -> bool {
    std::env::args().any(|a| a == "--loop")
}

fn run_daemon(ip: &str, port: u16) {
    if fs::metadata(PID_FILE).is_ok() {
        info!("[*] Previous daemon detected. Stopping it first...");
        stop_daemon();
        thread::sleep(Duration::from_secs(1));
    }

    info!("[+] Starting daemon on {}:{}", ip, port);

    let child = match Command::new(std::env::current_exe().unwrap())
        .arg("--loop")
        .arg("--ip").arg(ip)
        .arg("--port").arg(port.to_string())
        .stdin(Stdio::null())
        .stdout(Stdio::null())
        .stderr(Stdio::null())
        .spawn()
    {
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

async fn daemon_loop(args: &Args)  {
    // Setup signals
    let mut sigterm = tokio::signal::unix::signal(SignalKind::terminate())
        .expect("Cannot listen SIGTERM");
    let mut sigint = tokio::signal::unix::signal(SignalKind::interrupt())
        .expect("Cannot listen SIGINT");

    let pid = process::id().to_string();
    const KEY: &str = "9067941512fcb28a0db7d1beb0e9ece001995bf3f66e36b157a384efbc6bdae4";

    AesGcmCrypto::init_encryption(KEY).unwrap();

    // 初始化数据库连接池和表
    let db_pool = match sqlite::init_sqlite_pool("sqlite:data.db").await {
        Ok(pool) => {
            if let Err(e) = model_contact::Contact::init_table(&pool).await {
                error!("Failed to initialize contacts table: {}", e);
                return;
            }
            pool
        }
        Err(e) => {
            error!("Failed to initialize database: {}", e);
            return;
        }
    };

    // Create shared state
    let state = Arc::new(shared_state::AppState::new(db_pool));

    // Create the application router
    let app = server::create_app(state);

    // Start the server with explicit SocketAddr type
    let addr: std::net::SocketAddr = format!("{}:{}", args.ip, args.port)
        .parse()
        .expect("Invalid IP/Port");
    info!("Server starting on {}", addr);

    let listener = tokio::net::TcpListener::bind(addr).await.unwrap();

    // Use move to transfer ownership of sigterm and sigint to the async block
    let server = axum::serve(listener, app)
        .with_graceful_shutdown(async move {
            tokio::select! {
                _ = sigterm.recv() => info!("Received SIGTERM, shutting down"),
                _ = sigint.recv() => info!("Received SIGINT, shutting down"),
            }
        });

    tokio::select! {
        _ = server => {
            info!("Server stopped");
        }
        _ = async {
            loop {
                sleep(Duration::from_secs(5)).await;
                utils::get_memory_usage_cross_platform(&pid)
            }
        } => {}
    }
}

fn change_to_exe_dir() -> std::io::Result<()> {
    let exe_path = env::current_exe()?;
    if let Some(exe_dir) = exe_path.parent() {
        env::set_current_dir(exe_dir)?;
    }
    Ok(())
}

#[tokio::main]
async fn main() {
    if let Err(e) = change_to_exe_dir() {
        eprintln!("Failed to change to executable directory: {}", e);
        return;
    }

    let args = Args::parse();
    let log_level = if args.debug { "debug" } else { "info" };

    Logger::try_with_str(log_level)
        .unwrap()
        .use_utc()
        .log_to_file(
            FileSpec::default()
                .directory(".")
                .basename("run")
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
        info!("[+] Daemon loop running on {}:{}", args.ip, args.port);
        daemon_loop(&args).await;
        exit(0);
    }

    if args.stop {
        stop_daemon();
    } else if args.daemon {
        run_daemon(&args.ip, args.port);
    } else if args.gen_key {
        println!("Generating secure AES-GCM key:");

        // Generate random 32-byte key (64 hex chars)
        let mut key = [0u8; 32];
        OsRng.fill_bytes(&mut key);  // Now works with RngCore in scope

        // Convert to hex string
        let hex_key = hex::encode(key);

        println!("Hex key (64 characters):");
        println!("{}", hex_key);

        // Also generate UUID if needed
        println!("\nUUID for reference:");
        println!("{}", uuid::Uuid::new_v4());

    } else {
        daemon_loop(&args).await;
    }
}