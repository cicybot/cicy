import { CCWSClient, ClientIds } from './CCWSClient';

export class CCWSMainWindowClient extends CCWSClient {
    constructor() {
        super(ClientIds.MainWindow);
    }

    async _baseWindow(windowId: string, method: string, params?: object) {
        return this.send({
            action: 'callBaseWindow',
            payload: {
                windowId,
                method,
                params: params || {}
            }
        });
    }

    async _webContents(windowId: string, webContentsId: number, method: string, params?: object) {
        return this.send({
            action: 'callWebContents',
            payload: {
                windowId,
                webContentsId,
                method,
                params: params || {}
            }
        });
    }

    async setTitle(windowId: string, title: string) {
        return this._baseWindow(windowId, 'setTitle', { title });
    }

    async createWindow(payload: {
        windowId: string;
        url?: string;
        noWebview?: boolean;
        openDevTools?: boolean;
        windowOptions?: object;
    }) {
        return this.send({
            action: 'createWindow',
            payload
        });
    }

    async mainWindowInfo() {
        return this.send({
            action: 'mainWindowInfo'
        });
    }

    async message(msg: any) {
        return this.send(msg);
    }
}
