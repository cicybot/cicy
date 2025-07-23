const AUTH: Map<
    number,
    {
        proxyUsername?: string;
        proxyPassword?: string;
    }
> = new Map();
const IDS: Map<string, number> = new Map();

export default class WebContentsService {
    private readonly windowId: string;
    constructor(windowId: string) {
        this.windowId = windowId;
    }

    getWebContentsId() {
        return IDS.get(this.windowId);
    }

    bindInfo(webContentsId: number, proxyUsername?: string, proxyPassword?: string) {
        IDS.set(this.windowId, webContentsId);
        AUTH.set(webContentsId, {
            proxyUsername,
            proxyPassword
        });
    }
    static getAuthByWebContentsId(id: number) {
        return AUTH.get(id);
    }
}
