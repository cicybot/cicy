import { CCWSMainWindowClient } from '../cicy/CCWSMainWindowClient';

export class BackgroundApi {
    api: any;

    constructor() {
        this.api = window.backgroundApi ? window.backgroundApi : new CCWSMainWindowClient();
    }
    async getDownloadState(downloadItems: any[], downloadIds: Record<number, string>) {
        const downloadItemsMap = new Map();
        downloadItems.forEach(row => {
            downloadItemsMap.set(row.id, row);
        });
        const downloadItemRows = await this.send({
            action: 'getDownloadState',
            payload: {}
        });

        downloadItemRows.forEach((row: { getSavePath: string; savePath: string; id: string }) => {
            const t = row.id.split('/');
            const downloadId = parseInt(t[t.length - 1]);
            if (downloadIds[downloadId]) {
                const mediaId = downloadIds[downloadId];
                const r = {
                    ...row,
                    mediaId,
                    downloadId
                };
                downloadItemsMap.set(row.id, r);
            }
        });
        const res = Array.from(downloadItemsMap)
            .map(row => {
                const { getSavePath, savePath, ...r } = row[1];
                return {
                    ...r,
                    savePath: getSavePath || savePath
                };
            })
            .filter(row => row.state !== 'cancelled');
        res.sort((a: any, b: any) => b.ts - a.ts);
        return res;
    }

    async openUrl(url: string) {
        return await this.send({
            action: 'openUrl',
            payload: {
                url
            }
        });
    }
    async send(msg: { action: string; payload?: any }) {
        return await this.api.message(msg);
    }

    async setBounds(
        windowId: string,
        rect: { width?: number; height?: number; x?: number; y?: number },
        animate?: boolean
    ) {
        return await this.send({
            action: 'callBaseWindow',
            payload: {
                windowId,
                method: 'setBounds',
                params: {
                    rect,
                    animate
                }
            }
        });
    }

    async setMinimumSize(windowId: string, width: number, height: number) {
        return await this.send({
            action: 'callBaseWindow',
            payload: {
                windowId,
                method: 'setMinimumSize',
                params: {
                    width,
                    height
                }
            }
        });
    }

    async getMinimumSize(windowId: string) {
        return await this.send({
            action: 'callBaseWindow',
            payload: {
                windowId,
                method: 'getMinimumSize',
                params: {}
            }
        });
    }

    async getBounds(windowId: string) {
        return await this.send({
            action: 'callBaseWindow',
            payload: {
                windowId,
                method: 'getBounds',
                params: {}
            }
        });
    }

    currentConnectorClientId() {
        return this.send({
            action: 'currentConnectorClientId',
            payload: {}
        });
    }

    openPath(path: string) {
        return this.send({
            action: 'openPath',
            payload: {
                path
            }
        });
    }

    setWebContentConfig(
        windowId: string,
        webContentsId: number,
        {
            proxyRules,
            proxyPassword,
            proxyUsername
        }: {
            proxyRules?: string;
            proxyUsername?: string;
            proxyPassword?: string;
        }
    ) {
        return this.send({
            action: 'callWebContents',
            payload: {
                webContentsId,
                windowId,
                method: 'setConfig',
                params: {
                    proxyUsername,
                    proxyPassword,
                    proxyRules
                }
            }
        });
    }

    isPortOnline(port: number) {
        return this.utils({
            method: 'isPortOnline',
            params: [port]
        });
    }

    async killPort(port: number) {
        try {
            await this.utils({
                method: 'killPort',
                params: [port]
            });
        } catch (e) {}
    }

    async metaStart(port: number, cmd: string, showWin?: boolean) {
        await this.killPort(port);
        return this.openTerminal(cmd, showWin);
    }

    metaStop(port: number) {
        return this.killPort(port);
    }

    metaConfigTest(bin: string, path: string) {
        return this.shell(`${bin} -t ${path}`);
    }

    openTerminal(cmd: string, showWin?: boolean) {
        return this.utils({
            method: 'openTerminal',
            params: [cmd, showWin]
        });
    }

    killProcessByName(name: string) {
        return this.utils({
            method: 'killProcessByName',
            params: [name]
        });
    }

    shell(cmd: string, async?: boolean) {
        return this.utils({
            method: 'shell',
            params: async ? [cmd, true] : [cmd]
        });
    }

    mainWindowInfo() {
        return this.send({
            action: 'mainWindowInfo'
        });
    }

    async utils(payload: { method: string; params?: any }) {
        return await this.send({
            action: 'utils',
            payload
        });
    }

    async axios(
        url: string,
        params?: {
            method?: string;
            headers?: object;
            httpsProxy?: string;
            timeout?: number;
            proxy?: { host: string; port: number; protocol: string };
            params?: object;
            data?: object;
        }
    ) {
        return this.api.message({
            action: 'utils',
            payload: {
                method: 'axios',
                params: {
                    url,
                    ...params
                }
            }
        });
    }
}
