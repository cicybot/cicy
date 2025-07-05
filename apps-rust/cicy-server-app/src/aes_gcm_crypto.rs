use aes_gcm::{
    aead::{Aead, KeyInit, OsRng, rand_core::RngCore},
    Aes256Gcm, Nonce
};
use std::sync::OnceLock;
use hex;

static ENCRYPTION_KEY: OnceLock<[u8; 32]> = OnceLock::new();

pub struct AesGcmCrypto;

impl AesGcmCrypto {
    /// Initialize encryption key from hex string
    pub fn init_encryption(hex_key: &str) -> Result<(), String> {
        let bytes = hex::decode(hex_key)
            .map_err(|e| format!("Invalid hex string: {}", e))?;

        if bytes.len() != 32 {
            return Err("Key must be 32 bytes (64 hex characters)".into());
        }

        let mut key = [0u8; 32];
        key.copy_from_slice(&bytes);
        ENCRYPTION_KEY.set(key)
            .map_err(|_| "Encryption key already set".into())
    }

    /// Encrypt content using AES-GCM
    pub fn encrypt_content(content: &str) -> Result<Vec<u8>, String> {
        let key = ENCRYPTION_KEY.get().ok_or("Encryption key not initialized")?;
        let cipher = Aes256Gcm::new_from_slice(key).map_err(|e| e.to_string())?;

        let mut nonce = [0u8; 12];
        OsRng.fill_bytes(&mut nonce);
        let nonce = Nonce::from_slice(&nonce);

        let encrypted = cipher.encrypt(nonce, content.as_bytes())
            .map_err(|e| e.to_string())?;

        let mut result = nonce.to_vec();
        result.extend(encrypted);
        Ok(result)
    }

    /// Decrypt content using AES-GCM
    pub fn decrypt_content(encrypted: &[u8]) -> Result<String, String> {
        let key = ENCRYPTION_KEY.get().ok_or("Encryption key not initialized")?;
        let cipher = Aes256Gcm::new_from_slice(key).map_err(|e| e.to_string())?;

        if encrypted.len() < 12 {
            return Err("Invalid encrypted data".into());
        }

        let (nonce_bytes, ciphertext) = encrypted.split_at(12);
        let nonce = Nonce::from_slice(nonce_bytes);

        let decrypted = cipher.decrypt(nonce, ciphertext)
            .map_err(|e| e.to_string())?;

        String::from_utf8(decrypted).map_err(|e| e.to_string())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    const TEST_KEY: &str = "000102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f";

    #[test]
    fn test_key_initialization() {
        assert!(AesGcmCrypto::init_encryption(TEST_KEY).is_ok());
        assert!(AesGcmCrypto::init_encryption(TEST_KEY).is_err()); // Re-init fails
        assert!(AesGcmCrypto::init_encryption("short").is_err());
    }

    #[test]
    fn test_encrypt_decrypt_roundtrip() {
        AesGcmCrypto::init_encryption(TEST_KEY).unwrap();

        let plaintext = "Secret message";
        let encrypted = AesGcmCrypto::encrypt_content(plaintext).unwrap();
        let decrypted = AesGcmCrypto::decrypt_content(&encrypted).unwrap();

        assert_eq!(decrypted, plaintext);
        assert_ne!(encrypted, plaintext.as_bytes());
    }


    #[test]
    fn test_edge_cases() {
        AesGcmCrypto::init_encryption(TEST_KEY).unwrap();

        // Empty string
        assert!(AesGcmCrypto::encrypt_content("").is_ok());

        // Large data
        let large = "a".repeat(10_000);
        assert!(AesGcmCrypto::encrypt_content(&large).is_ok());

        // Invalid encrypted data
        assert!(AesGcmCrypto::decrypt_content(&[]).is_err());
        assert!(AesGcmCrypto::decrypt_content(&[0; 11]).is_err());
    }


}