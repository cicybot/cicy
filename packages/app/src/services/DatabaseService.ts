export default class DatabaseService {
    constructor() {}
    async exec(sql: string) {
        await window.backgroundApi.message({
            action: 'db',
            payload: {
                method: 'exec',
                params: [sql]
            }
        });
    }

    async get(sql: string, params?: any[]): Promise<any> {
        return window.backgroundApi.message({
            action: 'db',
            payload: {
                method: 'get',
                params: [sql, params || []]
            }
        });
    }

    async all(sql: string, params?: any[]): Promise<any[]> {
        return window.backgroundApi.message({
            action: 'db',
            payload: {
                method: 'all',
                params: [sql, params || []]
            }
        });
    }

    async run(sql: string, params?: any[]): Promise<any> {
        return window.backgroundApi.message({
            action: 'db',
            payload: {
                method: 'run',
                params: [sql, params || []]
            }
        });
    }
}
