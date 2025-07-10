// src/main.rs
mod server;
mod utils;
mod shared_state;
mod websocket;
mod api;
mod swagger;

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
#[cfg(unix)]
use libc;
use std::env;
use std::process;
use tokio::time::{sleep, Duration};

use std::sync::Arc;
use crate::utils::get_local_ip_address;

const PID_FILE: &str = "daemon_server.pid";

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

    /// download assets dir
    #[arg(long, default_value = "")]
    assets_dir: String,

    /// Server IP address to bind to
    #[arg(long, default_value = "0.0.0.0")]
    ip: String,

    /// Server port to listen on
    #[arg(long, default_value = "3101")]
    port: u16,

    #[arg(long = "loop", hide = true)]
    loop_mode: bool,

}

fn is_loop_mode() -> bool {
    std::env::args().any(|a| a == "--loop")
}

fn run_daemon(args: &Args) {
    let ip = args.ip.clone();
    let port = args.port;

    if fs::metadata(PID_FILE).is_ok() {
        info!("[*] Previous daemon detected. Stopping it first...");
        stop_daemon();
        thread::sleep(Duration::from_secs(1));
    }

    info!("[+] Starting daemon on {}:{}", ip, port);

    let mut command = Command::new(std::env::current_exe().unwrap());
    command.arg("--loop")
        .arg("--dir").arg(args.dir.clone())
        .arg("--assets-dir").arg(args.assets_dir.clone())
        .arg("--ip").arg(ip)
        .arg("--port").arg(port.to_string())
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
    let pid = process::id().to_string();

    // Create shared state
    let state = Arc::new(shared_state::AppState::new());

    // Create the application router
    let app = server::create_app(state,&args.assets_dir);

    // Start the server with explicit SocketAddr type
    let addr: std::net::SocketAddr = format!("{}:{}", args.ip, args.port)
        .parse()
        .expect("Invalid IP/Port");

    info!("Application starting with args: {:?}", args);
    info!("Server starting on {}", addr);

    let listener = tokio::net::TcpListener::bind(addr).await.unwrap();

    // Platform-specific signal handling
    #[cfg(unix)]
    let server = {
        use tokio::signal::unix::{signal, SignalKind};
        let mut sigterm = signal(SignalKind::terminate()).expect("Cannot listen SIGTERM");
        let mut sigint = signal(SignalKind::interrupt()).expect("Cannot listen SIGINT");

        axum::serve(listener, app)
            .with_graceful_shutdown(async move {
                tokio::select! {
                    _ = sigterm.recv() => info!("Received SIGTERM, shutting down"),
                    _ = sigint.recv() => info!("Received SIGINT, shutting down"),
                }
            })
    };

    #[cfg(windows)]
    let server = {
        axum::serve(listener, app)
            .with_graceful_shutdown(async {
                tokio::signal::ctrl_c()
                    .await
                    .expect("Failed to listen for Ctrl+C");
                info!("Received Ctrl+C, shutting down");
            })
    };

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

    // Clean up PID file
    fs::remove_file(PID_FILE).ok();
}

fn change_to_exe_dir(dir:&str) -> std::io::Result<()> {
    if !dir.is_empty(){
        println!("[+] Change to directory {}", dir);
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
    println!("args: {:?}",args);
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
                .basename("run_server")
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
    info!("Local_ip_address: {:?}", get_local_ip_address());

    if is_loop_mode() {
        info!("[+] Daemon loop running on {}:{}", args.ip, args.port);
        daemon_loop(&args).await;
        exit(0);
    }

    if args.stop {
        stop_daemon();
    } else if args.daemon {
        run_daemon(&args);
    } else {
        daemon_loop(&args).await;
    }
}
