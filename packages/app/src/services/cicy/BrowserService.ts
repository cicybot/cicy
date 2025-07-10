import { waitForResult } from '@cicy/utils';
import { SiteService } from '../model/SiteService';

import { CCWSMainWindowClient } from './CCWSMainWindowClient';
import { SiteAccount } from '../model/SiteAccount';
import { BackgroundApi } from '../common/BackgroundApi';

export default class BrowserService {
    url: string;
    siteId: string;
    windowId: string;
    accountIndex: number;
    service: SiteService;
    wsClientMainWindow: CCWSMainWindowClient;

    constructor(url: string, accountIndex?: number) {
        this.url = url;
        this.siteId = SiteService.getIdByUrl(url);
        this.accountIndex = accountIndex || 0;
        this.windowId = `${this.accountIndex}-${this.siteId}`;
        this.wsClientMainWindow = new CCWSMainWindowClient();
        this.service = new SiteService(this.siteId, this.accountIndex);
    }

    async openHomeUrl() {
        return this.goTo(this.url);
    }

    async initSite(noWebview?: number) {
        if (noWebview) {
            return;
        }
        const site = await this.service.getSiteInfo();
        if (!site) {
            await this.service.saveSiteInfo({
                url: this.url,
                no_webview: 0,
                site_id: this.siteId
            });
        } else {
            await this.service.saveSiteInfo({
                ...site,
                is_deleted: 0,
                no_webview: 0,
                updated_at: Math.floor(1000 * Date.now())
            });
        }
        const account = await this.service.getAccount();
        if (!account) {
            await SiteAccount.add(site.site_id);
        }
    }

    async openWindowNoWebview() {
        return this.openWindow({
            noWebview: true
        });
    }
    async openWindow(options?: { url?: string; noWebview?: boolean }) {
        if (options?.noWebview && !window.backgroundApi) {
            window.open(this.url);
            return;
        }
        await this.initSite(options?.noWebview ? 1 : 0);
        const { err } = await this.wsClientMainWindow.createWindow({
            windowId: this.windowId,
            url: this.url,
            ...options
        });
        if (err) {
            throw new Error(err);
        }
        await this.waitOnline();
    }

    async waitOnline() {
        try {
            await waitForResult(async () => {
                try {
                    const isOnline = await this.wsClientMainWindow.isOnline(this.windowId);
                    return !!isOnline;
                } catch (error) {
                    return false;
                }
            });
        } catch (error) {
            throw new Error('Error waitOnline is False');
        }
    }

    async getWebContentsId() {
        await this.waitOnline();
        const { webContentsId } = await new BackgroundApi().send({
            action: 'getWebContentsId',
            payload: {
                windowId: this.windowId
            }
        });
        return webContentsId;
    }

    async goTo(url: string) {
        return this.execJs(`location.href='${url}'`);
    }

    async webContents(method: string, params: object) {
        const webContentsId = await this.getWebContentsId();
        if (!webContentsId) {
            throw new Error('no webContentsId');
        }
        return this.wsClientMainWindow._webContents(this.windowId, webContentsId, method, params);
    }

    async execJs(code: string) {
        const webContentsId = await this.getWebContentsId();
        if (!webContentsId) {
            throw new Error('no webContentsId');
        }
        return this.webContents('execJs', {
            code: code
        });
    }
}
