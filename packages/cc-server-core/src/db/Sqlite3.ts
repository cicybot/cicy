import type BetterSqlite3 from 'better-sqlite3';
import DatabaseSqlite3, { Database } from 'better-sqlite3';

let db: BetterSqlite3.Database;

function boot() {
    db = s3();
    // db.exec(`DROP TABLE IF EXISTS site;`);
    // db.exec(`DROP TABLE IF EXISTS site_account;`);

    db.exec(`CREATE TABLE IF NOT EXISTS site (
        id INTEGER PRIMARY KEY,
        title TEXT,
        icon TEXT,
        content TEXT,
        url TEXT,
        is_deleted INTEGER NOT NULL DEFAULT 0,  -- 0 = 有效, 1 = 已删除
        updated_at INTEGER NOT NULL DEFAULT (strftime('%s','now'))
    );`);

    db.exec(`CREATE TABLE IF NOT EXISTS site_account (
        site_id INTEGER NOT NULL,
        account_id INTEGER NOT NULL,
        info TEXT,
        config TEXT,
        is_deleted INTEGER NOT NULL DEFAULT 0, -- 软删除标志
        updated_at INTEGER NOT NULL DEFAULT (strftime('%s','now')),
        PRIMARY KEY (site_id, account_id),
        FOREIGN KEY (site_id) REFERENCES site(id) ON DELETE CASCADE
    );`);
    
}
export function connectSqlite3(dbName: string = 'data/sqlite.db') {
    console.log("connectSqlite3",dbName)
    db = new DatabaseSqlite3(dbName, { verbose: console.log });
    db.pragma('journal_mode = WAL');
    boot();
}

//@ts-ignore
export function s3():Database {
    return db!;
}
process.on('SIGINT', () => {
    db && db.close();
});
