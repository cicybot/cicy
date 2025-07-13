import { CCWSMainWindowClient } from '../cicy/CCWSMainWindowClient';

export default class DatabaseService {
    constructor() {}

    async _message(msg: any) {
        if (window.backgroundApi) {
            return window.backgroundApi.message(msg);
        } else {
            return new CCWSMainWindowClient().send(msg);
        }
    }

    async exec(sql: string) {
        await this._message({
            action: 'db',
            payload: {
                method: 'exec',
                params: [sql]
            }
        });
    }

    async get(sql: string, params?: any[]): Promise<any> {
        const { err, result } = await this._message({
            action: 'db',
            payload: {
                method: 'get',
                params: [sql, params || []]
            }
        });
        return result;
    }

    async all(sql: string, params?: any[]): Promise<any[]> {
        return this._message({
            action: 'db',
            payload: {
                method: 'all',
                params: [sql, params || []]
            }
        });
    }

    async run(sql: string, params?: any[]): Promise<any> {
        return this._message({
            action: 'db',
            payload: {
                method: 'run',
                params: [sql, params || []]
            }
        });
    }
}
