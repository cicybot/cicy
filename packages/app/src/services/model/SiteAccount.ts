import DatabaseService from '../common/DatabaseService';
import { SiteAccountInfo } from './SiteService';

export class SiteAccount {
    accountIndex: number;
    siteId: string;

    constructor(siteId: string, accountIndex?: number) {
        this.accountIndex = accountIndex || 0;
        this.siteId = siteId;
    }

    async get(): Promise<SiteAccountInfo> {
        const res = await new DatabaseService().get(
            `select *
             from site_account
             where account_index = ?
               and site_id = ?`,
            [this.accountIndex, this.siteId]
        );
        return {
            ...res,
            auth: JSON.parse(res?.auth || '{}'),
            config: JSON.parse(res?.config || '{}')
        };
    }

    async save(site: SiteAccountInfo) {
        const row = await this.get();
        if (row) {
            return await new DatabaseService().run(
                `UPDATE site_account
                 set auth = ?,
                     config = ?,
                     is_deleted = ?
                 WHERE account_index = ?
                   and site_id = ?`,
                [
                    JSON.stringify(site.auth),
                    JSON.stringify(site.config),
                    site.is_deleted,
                    site.account_index,
                    site.site_id
                ]
            );
        } else {
            throw new Error('no site account');
        }
    }

    static async add(siteId: string, num?: number, config?: object, auth?: object) {
        if (!num) {
            num = 1;
        }
        let id = null;

        for (let i = 0; i < num; i++) {
            const accountIndex = await this.getCurrentIndex(siteId);
            const res = await new DatabaseService().run(
                `INSERT INTO site_account (account_index, site_id, config, auth)
                 VALUES (?, ?, ?, ?)`,
                [accountIndex, siteId, JSON.stringify(config || {}), JSON.stringify(config || {})]
            );
            if (res) {
                const { lastInsertRowid } = res;
                id = lastInsertRowid;
            }
        }
        return id;
    }

    static async getRows(siteId: string): Promise<SiteAccountInfo[]> {
        const rows = await new DatabaseService().all(
            `select *
             from site_account
             where site_id = ?
             order by id asc`,
            [siteId]
        );
        return rows.map((row: any) => {
            return {
                ...row,
                config: JSON.parse(row.config),
                auth: JSON.parse(row.auth)
            };
        });
    }

    static async getCurrentIndex(siteId: string): Promise<number> {
        const res = await new DatabaseService().get(
            `select account_index
             from site_account
             where site_id = ?
             order by account_index desc`,
            [siteId]
        );
        if (!res) {
            return 0;
        } else {
            return res['account_index'] + 1;
        }
    }

    static async initDb() {
        if (!localStorage.getItem('site_account_inited')) {
            //DROP TABLE IF EXISTS site_account;
            await new DatabaseService().exec(`
                CREATE TABLE IF NOT EXISTS site_account
                (
                    id
                    INTEGER
                    PRIMARY
                    KEY,
                    site_id
                    TEXT,
                    account_index
                    INTEGER,
                    auth
                    TEXT,
                    config
                    TEXT,
                    is_deleted
                    INTEGER
                    NOT
                    NULL
                    DEFAULT
                    0, -- 0 = 有效, 1 = 已删除
                    updated_at
                    INTEGER
                    NOT
                    NULL
                    DEFAULT (
                    strftime
                (
                    '%s',
                    'now'
                ))
                    );
            `);
            localStorage.setItem('site_account_inited', 'true');
        }
    }
}
