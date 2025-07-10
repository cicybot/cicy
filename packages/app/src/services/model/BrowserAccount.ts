import DatabaseService from '../common/DatabaseService';
import { AccountAuthInfo } from './SiteService';

export interface BrowserAccountConfigInfo {
    proxyEnabled?: boolean;
    userAgent?: string;
    testIp?: string;
    testLocation?: string;
    testTs?: number;
    testDelay?: number;
    proxyConfig?: string;
}

export interface BrowserAccountInfo {
    id: number;
    config: BrowserAccountConfigInfo;
}

export interface BrowserAccountSite {
    auth: AccountAuthInfo;
    config: object;
    site_id: string;
    title: string;
    icon: string;
    url: string;
    account_index: number;
}

export class BrowserAccount {
    accountIndex: number;

    constructor(accountIndex?: number) {
        this.accountIndex = accountIndex || 0;
    }

    async getSites(): Promise<BrowserAccountSite[]> {
        const res = await new DatabaseService().all(
            `select a.account_index,a.auth,a.config,s.site_id,s.title,s.icon,s.url
                 from site_account as a
                 left join site as s on s.site_id = a.site_id
                 where account_index = ?`,
            [this.accountIndex]
        );
        return res.map(row => {
            return {
                ...row,
                auth: JSON.parse(row.auth),
                config: JSON.parse(row.config)
            };
        });
    }

    async get(): Promise<BrowserAccountInfo> {
        const res = await new DatabaseService().get(
            `select *
                 from browser_account
                 where id = ?`,
            [this.accountIndex]
        );
        return {
            ...res,
            config: JSON.parse(res.config)
        };
    }

    async save(config: BrowserAccountConfigInfo) {
        const row = await this.get();
        if (row) {
            return await new DatabaseService().run(
                `UPDATE browser_account
                 set config = ?
                 WHERE id = ?`,
                [JSON.stringify(config), this.accountIndex]
            );
        } else {
            throw new Error('no browser account');
        }
    }

    static async add(config?: BrowserAccountConfigInfo, num?: number) {
        if (!num) {
            num = 1;
        }
        let id = null;
        for (let i = 0; i < num; i++) {
            const res = await new DatabaseService().run(
                `INSERT INTO browser_account (config)
                 VALUES (?)`,
                [JSON.stringify(config || {})]
            );
            if (res) {
                const { lastInsertRowid } = res;
                id = lastInsertRowid;
            }
        }
        return id;
    }

    static async getAccounts(): Promise<BrowserAccountInfo[]> {
        const rows = await new DatabaseService().all(
            `select *
             from browser_account
             order by id asc`
        );
        return rows.map((row: any) => {
            return {
                ...row,
                config: JSON.parse(row.config)
            };
        });
    }

    static async initDb() {
        if (!localStorage.getItem('browser_account_inited')) {
            //DROP TABLE IF EXISTS browser_account;
            await new DatabaseService().exec(`
                CREATE TABLE IF NOT EXISTS browser_account
                (
                    id
                    INTEGER
                    PRIMARY
                    KEY,
                    config
                    TEXT,
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
            localStorage.setItem('browser_account_inited', 'true');
        }
    }
}
