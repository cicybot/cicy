//main.rs
use clap::{arg, Parser};
use flexi_logger::{Logger, WriteMode, FileSpec, Duplicate, Record, DeferredNow};
use log::{info, debug,error};
use std::{fs, thread, process::{exit, Command}};
use time::{format_description, UtcOffset};
use std::process::Stdio;

use tokio::signal::unix::{SignalKind};
use tokio::time::{sleep, Duration};
use std::env;
use reqwest;

use std::process;

mod jsonrpc_server;
mod device;
mod shell;
mod file;
mod utils;

mod downloader;
mod daemon;

const PID_FILE: &str = "daemon.pid";

#[derive(Parser, Debug)]
#[command(author, version, about)]
struct Args {
    /// Run as daemon
    #[arg(short = 'd', long)]
    daemon: bool,

    #[arg(long, default_value = "", value_name = "RUN_DAEMON")]
    run_daemon: String,

    #[arg(long, default_value = "", value_name = "RUN_DAEMON_NAME")]
    run_daemon_name: String,

    #[arg(long, default_value = "", value_name = "STOP_DAEMON")]
    stop_daemon: String,

    /// Stop the daemon
    #[arg(long)]
    stop: bool,

    /// Run with level debug log
    #[arg(long)]
    debug: bool,

    #[arg(long)]
    device_info: bool,

    /// Host for json rpc
    #[arg(long, default_value = "0.0.0.0:9100", value_name = "JSON_RPC")]
    json_rpc: String,

    /// Request Url
    #[arg(long, default_value = "", value_name = "CURL")]
    curl: String,

    /// Save Path
    #[arg(long, default_value = "", value_name = "OUTPUT")]
    output: String,

    #[arg(long = "loop", hide = true)]
    loop_mode: bool,
}

fn is_loop_mode() -> bool {
    std::env::args().any(|a| a == "--loop")
}

fn run_daemon() {
    if fs::metadata(PID_FILE).is_ok() {
        info!("[*] Previous daemon detected. Stopping it first...");
        daemon::stop_daemon(PID_FILE.parse().unwrap());
        // Give it a second to shut down
        thread::sleep(Duration::from_secs(1));
    }
    info!("[+] Starting daemon... cmd: {:?}", std::env::current_exe().unwrap());

    let child = match Command::new(std::env::current_exe().unwrap())
        .arg("--loop")
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


fn custom_format(
    w: &mut dyn std::io::Write,
    now: &mut DeferredNow,
    record: &Record,
) -> std::io::Result<()> {
    let offset = UtcOffset::from_hms(8, 0, 0).unwrap();
    let east8_time = now.now().to_offset(offset);
    // 格式化字符串
    let ts_fmt = format_description::parse("[year]-[month]-[day] [hour]:[minute]:[second]")
        .expect("invalid format");
    let timestamp = east8_time.format(&ts_fmt).unwrap_or_else(|_| "????-??-?? ??:??:??".into());

        // 简化文件路径
    let file = record
        .file()
        .map(|f| std::path::Path::new(f).file_name().unwrap_or_default().to_string_lossy())
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
    info!("[+] [Args]: {:?}",args);
    let device_info = device::get_device_info_min();
    info!("[+] [DeviceInfo]:{}",device_info);

    info!("JSON Server: {}", args.json_rpc);

    let jsonrpc_addr = args.json_rpc.clone();

    // 启动 JSON-RPC 服务器任务
    let jsonrpc_handle = tokio::spawn(async move {
        jsonrpc_server::run_jsonrpc_server(&jsonrpc_addr).await;
    });

    // Setup signals
    let mut sigterm = tokio::signal::unix::signal(SignalKind::terminate()).expect("Cannot listen SIGTERM");
    let mut sigint = tokio::signal::unix::signal(SignalKind::interrupt()).expect("Cannot listen SIGINT");

    loop {
        tokio::select! {
            _ = sigterm.recv() => {
                info!("Received SIGTERM, exiting gracefully");
                break;
            }
            _ = sigint.recv() => {
                info!("Received SIGINT, exiting gracefully");
                break;
            }
            _ = sleep(Duration::from_secs(5)) => {
                // if utils::is_android_linux(){
                //     let device_info = device::get_device_info_min();
                //     info!("deviceInfo:{}",device_info);
                // }
                // utils::get_memory_usage_cross_platform(&pid)
            }
        }
    }

    info!("Shutting down daemon_loop");
    jsonrpc_handle.abort();

}

fn change_to_exe_dir() -> std::io::Result<()> {
    // Get the current executable's path
    let exe_path = env::current_exe()?;

    // Get the parent directory
    if let Some(exe_dir) = exe_path.parent() {
        // Change the current working directory
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
                .directory(".")         // current dir
                .basename("run")
                .suffix("log")
                .suppress_timestamp()   // force log file name = run.log
        )
        .duplicate_to_stdout(Duplicate::All) // also log to stdout
        .append()                            // append to file (don't overwrite)
        .write_mode(WriteMode::BufferAndFlush)
        .format(custom_format)  // use your custom format function
        .start()
        .unwrap();
    debug!("is_android_linux: {}",utils::is_android_linux());
    debug!("This will be logged to run.log file");
    // daemon::run_daemon("/sbin/ping 127.0.0.1 >> /tmp/ping.log","ping");

    if is_loop_mode() {
        info!("[+] Daemon loop running...");
        daemon_loop(&args).await;
        exit(0);
    }

    if args.stop {
        daemon::stop_daemon(PID_FILE.parse().unwrap());
    } else if args.daemon {
        run_daemon();
    } else if !args.stop_daemon.is_empty() {
        daemon::stop_daemon_name(args.stop_daemon);
    } else if !args.run_daemon.is_empty() && !args.run_daemon_name.is_empty() {
        daemon::run_daemon(args.run_daemon.as_str(),args.run_daemon_name.as_str());
    } else if !args.curl.is_empty() {

        let res = match reqwest::get(args.curl).await{
            Ok(res) => res,
            Err(e)=>{
                error!("[-] Failed to send request to daemon: {}", e);
                exit(1)
            }
        };
        info!("Response: {:?} {}", res.version(), res.status());
        info!("Headers: {:#?}", res.headers());
        let body = match res.bytes().await{
            Ok(body) => body,
            Err(e)=>{
                error!("[-] Failed to read response body: {}", e);
                exit(1)
            }
        };
        println!("{:?}", body);

        if !args.output.is_empty(){
            let err = fs::write(args.output, body);
            if err.is_err() {
                error!("[-] Failed to write : {}", err.unwrap_err());
                exit(1);
            }
            info!("Saved!!");
        }
    } else if args.device_info {
        let device_info = device::get_device_info();
        print!("{}",device_info)
    } else {
        daemon_loop(&args).await;
    }
}
