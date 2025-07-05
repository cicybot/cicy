use chrono::Utc;
use log::info;
use serde::{Deserialize, Serialize};
use sqlx::{FromRow, SqlitePool};
use crate::aes_gcm_crypto::AesGcmCrypto;

#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct Contact {
    pub id: Option<i64>,
    pub mobile_id: String,
    pub content: String,  // This will hold the decrypted content
    pub created_at: i64,
    pub updated_at: i64,
}
// Define a separate struct for DB operations
#[derive(FromRow)]
struct ContactDbRow {
    id: Option<i64>,
    mobile_id: String,
    content: Vec<u8>,  // This will store the encrypted BLOB
    created_at: i64,
    updated_at: i64,
}

#[derive(Debug, Serialize, FromRow)]
pub struct ContactSummary {
    pub id: i64,
    pub mobile_id: String,
    pub created_at: i64,
    pub updated_at: i64,
}


impl Contact {
    // Helper to convert from DB row to our model
    fn from_row(row: ContactDbRow) -> Result<Self, sqlx::Error> {
        info!("row.content: {:?}",row.content);
        let decrypted = AesGcmCrypto::decrypt_content(&row.content)
            .map_err(|e| sqlx::Error::Protocol(e.into()))?;
        info!("row.content decrypted: {}",decrypted);
        Ok(Self {
            id: row.id,
            mobile_id: row.mobile_id,
            content: decrypted,
            created_at: row.created_at,
            updated_at: row.updated_at,
        })
    }
    pub async fn upsert(pool: &SqlitePool, mobile_id: String, content: String) -> Result<Self, sqlx::Error> {
        let now = Utc::now().timestamp();
        let encrypted_content = AesGcmCrypto::encrypt_content(&content)
            .map_err(|e| sqlx::Error::Protocol(e.into()))?;


        // Try to update first
        if let Some(row) = sqlx::query_as::<_, ContactDbRow>(
            r#"
            UPDATE contacts
            SET content = ?, updated_at = ?
            WHERE mobile_id = ?
            RETURNING *
            "#,
        )
            .bind(&encrypted_content)
            .bind(now)
            .bind(&mobile_id)
            .fetch_optional(pool)
            .await?
        {
            return Self::from_row(row);
        }
        // If update didn't find anything, insert new
        let row = sqlx::query_as::<_, ContactDbRow>(
            r#"
            INSERT INTO contacts (mobile_id, content, created_at, updated_at)
            VALUES (?, ?, ?, ?)
            RETURNING *
            "#,
        )
            .bind(mobile_id)
            .bind(encrypted_content)
            .bind(now)
            .bind(now)
            .fetch_one(pool)
            .await?;

        Self::from_row(row)
    }

    pub async fn get_all(pool: &SqlitePool) -> Result<Vec<ContactSummary>, sqlx::Error> {
        sqlx::query_as::<_, ContactSummary>(
            r#"
            SELECT id, mobile_id, created_at, updated_at
            FROM contacts
            ORDER BY created_at DESC
            "#
        )
            .fetch_all(pool)
            .await
    }

    pub async fn get_by_mobile_id(pool: &SqlitePool, mobile_id: &str) -> Result<Option<Self>, sqlx::Error> {
        if let Some(row) = sqlx::query_as::<_, ContactDbRow>(
            "SELECT * FROM contacts WHERE mobile_id = ?",
        )
            .bind(mobile_id)
            .fetch_optional(pool)
            .await?
        {
            Ok(Some(Self::from_row(row)?))
        } else {
            Ok(None)
        }
    }

    pub async fn init_table(pool: &SqlitePool) -> Result<(), sqlx::Error> {
        sqlx::query(
            r#"
            PRAGMA journal_mode = WAL;
            PRAGMA foreign_keys = ON;
            PRAGMA synchronous = NORMAL;
            CREATE TABLE IF NOT EXISTS contacts (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                mobile_id TEXT NOT NULL UNIQUE,
                content BLOB NOT NULL,
                created_at INTEGER NOT NULL,
                updated_at INTEGER NOT NULL
            );
            CREATE INDEX IF NOT EXISTS idx_contacts_mobile_id ON contacts (mobile_id);
            "#
        )
            .execute(pool)
            .await?;
        Ok(())
    }
}