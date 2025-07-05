import { OnBeforeSendHeadersListenerDetails } from 'electron';

const Filters: Map<string, string[]> = new Map();
const Requests: Map<string, any> = new Map();
const IdMap: Map<number, string> = new Map();
let counter = 0;
export default class WebContentsRequest {
    windowId: string;
    constructor(id: string) {
        this.windowId = id;
        if (!Requests.get(this.windowId)) {
            Requests.set(this.windowId, {});
        }
    }
    static fromWebContentsId(webContentsId: number) {
        if (IdMap.has(webContentsId)) {
            const windowId = IdMap.get(webContentsId);
            return new WebContentsRequest(windowId);
        } else {
            return null;
        }
    }
    setWebContentsId(id: number) {
        IdMap.set(id, this.windowId);
        return this;
    }
    checkFilter(url: string) {
        const filters = this.getFilters();
        if (filters.length > 0) {
            for (const i in filters) {
                const item = filters[i];
                if (url.indexOf(item) > -1) {
                    return true;
                }
            }
        }
        return false;
    }
    process(detail: OnBeforeSendHeadersListenerDetails) {
        const { url, method, requestHeaders } = detail;
        if (this.getFilters().length > 0) {
            console.log(this.getFilters(), detail.url);
        }
        if (!this.checkFilter(url)) {
            return;
        }
        counter++;
        Requests.set(this.windowId, {
            ...Requests.get(this.windowId),
            [counter]: {
                method,
                url,
                requestHeaders
            }
        });
    }
    clearRequests() {
        Requests.delete(this.windowId);
    }
    getRequests() {
        return Requests.get(this.windowId);
    }
    setFilters(filters: string[]) {
        Filters.set(this.windowId, filters);
        return this;
    }
    getFilters() {
        return Filters.get(this.windowId) || [];
    }
}
