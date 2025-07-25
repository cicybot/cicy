use log::debug;
use std::fs;
pub fn get_file_content(path: &str) -> Result<String, Box<dyn std::error::Error>> {
    match fs::read_to_string(path) {
        Ok(s) => Ok(s.into()),
        Err(e) => Err(e.into()),
    }
}

pub fn put_file_content(path: &str, content: &str) -> Result<String, Box<dyn std::error::Error>> {
    debug!("{} : {}", path, content);
    let err = fs::write(path, content);
    if err.is_err() {
        return Err(Box::new(err.unwrap_err()));
    }
    Ok("ok".into())
}
