import type BetterSqlite3 from 'better-sqlite3';
import DatabaseSqlite3, { Database } from 'better-sqlite3';

let db: BetterSqlite3.Database;
function boot() {
    db = s3();
}
export function connectSqlite3(dbName = 'data.db') {
    console.log('[+] DbName:', dbName);
    db = new DatabaseSqlite3(dbName, {
        verbose: () => {
            // console.log(msg)
        }
    });
    db.pragma('journal_mode = WAL');
    boot();
}

export function s3(): Database {
    return db!;
}
