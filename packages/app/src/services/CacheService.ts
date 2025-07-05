import DatabaseService from './DatabaseService';

export class CacheService {
    constructor() {}
    static async initDb() {
        if (!localStorage.getItem('cache_inited_13')) {
            //DROP TABLE IF EXISTS site;
            await new DatabaseService().exec(`
                CREATE TABLE IF NOT EXISTS cache (
                    name TEXT PRIMARY KEY,
                    value TEXT
                );
                `);
            localStorage.setItem('cache_db_inited_13', 'true');
            const table_info = await new DatabaseService().all(`PRAGMA table_info(cache);`);
            console.log('site table_info: ', table_info);
        }
    }
    static async set(name: string, value: any) {
        const res = await new DatabaseService().get(`select value from cache where name = ?`, [
            name
        ]);
        if (res) {
            await new DatabaseService().run(`UPDATE cache SET value = ? WHERE name = ?`, [
                JSON.stringify([value]),
                name
            ]);
        } else {
            await new DatabaseService().run(`INSERT INTO cache (name,value) VALUES (?,?)`, [
                name,
                JSON.stringify([value])
            ]);
        }
    }
    static async get(name: string) {
        const res = await new DatabaseService().get(`select value from cache where name = ?`, [
            name
        ]);
        if (!res) {
            return null;
        } else {
            return JSON.parse(res['value'])[0];
        }
    }
}
