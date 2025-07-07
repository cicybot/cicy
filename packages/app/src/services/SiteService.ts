import md5 from 'md5';
import DatabaseService from './DatabaseService';
import { CacheService } from './CacheService';

export interface SiteInfo {
    id?: number;
    site_id: string;
    url: string;
    no_webview?: number;
    is_deleted?: number;
    title?: string;
    icon?: string;
    created_at?: number;
    updated_at?: number;
}

export interface AccountInfo {
    username?: string;
    password?: string;
    email?: string;
    phone?: string;
}

export interface SiteAccountInfo {
    is_deleted?: boolean;
    account_index: number;
    auth: AccountInfo;
}

export interface SiteAccountStateInfo {
    webContentsId?: number;
    currentUrl?: string;
    err?: string;
    state?: string;
    loading?: boolean;
    updatedAt?: number;
}

export class SiteService {
    private siteId: string;
    private accountIndex: number;

    constructor(siteId: string, accountIndex?: number) {
        this.siteId = siteId;
        this.accountIndex = accountIndex || 0;
    }

    static addAccount(accounts: SiteAccountInfo[]) {
        let account_index = 0;
        if (accounts.length > 0) {
            accounts.sort((a, b) => -a.account_index + b.account_index);
            account_index = accounts[0].account_index + 1;
        }
        return { accounts: [{ account_index, auth: {} }, ...accounts], account_index };
    }

    static updateAccount(accounts: SiteAccountInfo[], account: SiteAccountInfo) {
        return accounts.map(row => {
            if (account.account_index === row.account_index) {
                return account;
            }
            return row;
        });
    }
    static async initDb() {
        if (!localStorage.getItem('site_db_inited_13')) {
            //DROP TABLE IF EXISTS site;
            await new DatabaseService().exec(`
                
                CREATE TABLE IF NOT EXISTS site (
                    id INTEGER PRIMARY KEY,
                    site_id TEXT,
                    no_webview INTEGER NOT NULL DEFAULT 0,
                    url TEXT,
                    title TEXT DEFAULT NULL,
                    icon TEXT DEFAULT NULL,
                    is_deleted INTEGER NOT NULL DEFAULT 0,  -- 0 = 有效, 1 = 已删除
                    created_at INTEGER NOT NULL DEFAULT (strftime('%s','now')),
                    updated_at INTEGER NOT NULL DEFAULT (strftime('%s','now'))
                );
                `);
            localStorage.setItem('site_db_inited_13', 'true');
            const table_info = await new DatabaseService().all(`PRAGMA table_info(site);`);
            console.log('site table_info: ', table_info);
        }
    }
    static async getAllSite() {
        return new DatabaseService().all(
            `select * from site where is_deleted= 0 and is_deleted= 0 order by updated_at desc`
        );
    }
    async getSiteInfo(): Promise<SiteInfo> {
        const res = await new DatabaseService().get(`select * from site where site_id = ?`, [
            this.siteId
        ]);
        return res;
    }
    async saveSiteInfo(site: SiteInfo) {
        const res = await this.getSiteInfo();
        if (res) {
            const fieldsToUpdate = [];
            const values = [];
            if (site.title !== undefined) {
                fieldsToUpdate.push('title = ?');
                values.push(site.title || null);
            }
            if (site.no_webview !== undefined) {
                fieldsToUpdate.push('no_webview = ?');
                values.push(site.no_webview || 0);
            }
            if (site.is_deleted !== undefined) {
                fieldsToUpdate.push('is_deleted = ?');
                values.push(site.is_deleted);
            }

            if (site.icon !== undefined) {
                fieldsToUpdate.push('icon = ?');
                values.push(site.icon || null);
            }

            if (site.updated_at !== undefined) {
                fieldsToUpdate.push('updated_at = ?');
                values.push(site.updated_at);
            } else {
                fieldsToUpdate.push('updated_at = ?');
                values.push(Math.floor(Date.now() / 1000));
            }

            if (values.length < 1) {
                throw new Error('update values is invalid');
            }

            values.push(this.siteId); // For WHERE clause
            const result = await new DatabaseService().run(
                `UPDATE site SET ${fieldsToUpdate.join(', ')} WHERE site_id = ?`,
                values
            );
            console.log(result);
        } else {
            await new DatabaseService().run(
                `INSERT INTO site (site_id,url,no_webview,title,icon,updated_at) VALUES (?,?,?,?,?,?)`,
                [
                    site.site_id,
                    site.url,
                    site.no_webview ? 1 : 0,
                    site.title || null,
                    site.icon || null,
                    Math.floor(Date.now() / 1000)
                ]
            );
        }
        return res;
    }
    async deleteSite() {
        await new DatabaseService().run(
            'UPDATE site SET is_deleted = 1, updated_at = ? WHERE site_id = ?',
            [Math.floor(1000 * Date.now()), this.siteId]
        );
    }
    async getAccounts(): Promise<SiteAccountInfo[]> {
        const rows = await CacheService.get(`site_accounts_${this.siteId}`);
        return rows || [];
    }
    async getAccount(): Promise<SiteAccountInfo | null> {
        const accounts = await this.getAccounts();
        if (!accounts) {
            return null;
        } else {
            return accounts.find(row => row.account_index === this.accountIndex) || null;
        }
    }
    async getAccountState(): Promise<SiteAccountStateInfo> {
        const state = sessionStorage.getItem(`acc_${this.siteId}_${this.accountIndex}`);
        return state ? JSON.parse(state) : {};
    }
    async saveAccounts(accounts: SiteAccountInfo[]) {
        return CacheService.set(`site_accounts_${this.siteId}`, accounts);
    }
    async saveAccountState(accountState: SiteAccountStateInfo) {
        sessionStorage.setItem(
            `acc_${this.siteId}_${this.accountIndex}`,
            JSON.stringify(accountState)
        );
    }
    static getIdByUrl(url: string) {
        return md5(url);
    }
}
