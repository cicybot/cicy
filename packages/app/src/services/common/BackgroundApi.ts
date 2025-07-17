import { CCWSMainWindowClient } from '../cicy/CCWSMainWindowClient';

export class BackgroundApi {
    api: any;

    constructor() {
        this.api = window.backgroundApi ? window.backgroundApi : new CCWSMainWindowClient();
    }

    send(msg: { action: string; payload?: any }) {
        return this.api.message(msg);
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
            requestFilters
        }: {
            proxyRules?: string;
            requestFilters?: string[];
        }
    ) {
        return this.send({
            action: 'callWebContents',
            payload: {
                webContentsId,
                windowId,
                method: 'setConfig',
                params: {
                    requestFilters,
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

    utils(payload: { method: string; params?: any }) {
        return this.send({
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
