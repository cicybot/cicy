import { CCWSClient } from './CCWSClient';

export default class CCBaseAgentClient {
    clientId?: string;

    constructor() {}

    setClientId(clientId: string) {
        this.clientId = clientId;
    }

    async isOnline() {
        return;
    }

    async _api(action: string, paylaod?: object) {
        if (!this.clientId) {
            throw new Error('no clientId');
        }
        const res = await new CCWSClient(this.clientId).sendAction(action, paylaod || {});
        if (res.err) {
            throw new Error(res.err);
        }
        let { result } = res;
        if (result.includes('\r\n')) {
            result = result.replace(/\r\n/g, '\n');
        }
        return result.trim();
    }

    async _apiShell(method: string, params: string | any[]) {
        return await this._api('shell', {
            method,
            params: typeof params === 'string' ? [params] : params || []
        });
    }

    async _apiFile(method: string, params: string | any[]) {
        return await this._api('file', {
            method,
            params: typeof params === 'string' ? [params] : params || []
        });
    }

    async downloadUrl(url: string, filePath: string) {
        return await this._apiFile('download', [url, filePath]);
    }
}
