use std::fs::File;
use std::io::{self, Write, Read};
use std::path::Path;
use reqwest::blocking::Client;
use indicatif::{ProgressBar, ProgressStyle};

pub struct Downloader {
    client: Client,
}

#[derive(Debug)]
pub enum DownloadError {
    Reqwest(String),
    Io(String),
    IncompleteDownload,
}

impl From<reqwest::Error> for DownloadError {
    fn from(err: reqwest::Error) -> Self {
        DownloadError::Reqwest(err.to_string())
    }
}

impl From<io::Error> for DownloadError {
    fn from(err: io::Error) -> Self {
        DownloadError::Io(err.to_string())
    }
}

impl std::fmt::Display for DownloadError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            DownloadError::Reqwest(msg) => write!(f, "HTTP error: {}", msg),
            DownloadError::Io(msg) => write!(f, "IO error: {}", msg),
            DownloadError::IncompleteDownload => write!(f, "Download incomplete"),
        }
    }
}

impl std::error::Error for DownloadError {}

impl Downloader {
    pub fn new() -> Self {
        Downloader {
            client: Client::builder()
                .timeout(std::time::Duration::from_secs(30))
                .build()
                .expect("Failed to create HTTP client"),
        }
    }

    pub fn download<P: AsRef<Path>>(
        &self,
        url: &str,
        save_path: P,
    ) -> Result<String, DownloadError> {
        let pb = ProgressBar::new_spinner();
        pb.set_style(ProgressStyle::default_spinner()
            .template("{spinner:.green} [{elapsed_precise}] {msg}")
            .unwrap());
        pb.set_message("Connecting...");

        let response = self.client.get(url).send()?;
        let total_size = response.content_length().unwrap_or(0);

        if total_size > 0 {
            pb.set_length(total_size);
            pb.set_style(ProgressStyle::default_bar()
                .template("{spinner:.green} [{elapsed_precise}] [{bar:40.cyan/blue}] {bytes}/{total_bytes} ({eta})")
                .unwrap()
                .progress_chars("#>-"));
        }

        pb.set_message("Downloading...");

        let mut file = File::create(save_path)?;
        let mut buffer = [0; 8192];
        let mut reader = response;

        loop {
            let bytes_read = reader.read(&mut buffer)?;
            if bytes_read == 0 {
                break;
            }
            file.write_all(&buffer[..bytes_read])?;
            pb.inc(bytes_read as u64);
        }

        if total_size > 0 && pb.position() < total_size {
            return Err(DownloadError::IncompleteDownload);
        }

        pb.finish_with_message("Download complete");
        Ok(format!("Downloaded {} bytes to specified path", total_size))
    }
}
#[allow(dead_code)]
pub fn downloader_url(url: &str, save_path: &str) -> Result<String, Box<dyn std::error::Error>> {
    let downloader = Downloader::new();
    downloader.download(url, save_path).map_err(|e| Box::new(e) as Box<dyn std::error::Error>)
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs;

    #[test]
    fn test_download_baidu() {
        let test_url = "http://127.0.0.1:3101";
        let test_path = "test.log";

        // Clean up any existing test file
        let _ = fs::remove_file(test_path);

        let result = downloader_url(test_url, test_path);
        assert!(result.is_ok(), "Download should succeed");

        // Verify file was created
        assert!(Path::new(test_path).exists(), "File should exist after download");

        // Verify file has content
        let metadata = fs::metadata(test_path).expect("Failed to read file metadata");
        assert!(metadata.len() > 0, "Downloaded file should not be empty");

        // Clean up
        fs::remove_file(test_path).expect("Failed to clean up test file");
    }
}