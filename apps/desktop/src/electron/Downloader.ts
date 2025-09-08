export interface DownloadState {
    id: string;
    ts: number;
    savePath: string;
    filename: string;
    totalBytes: number;
    receivedBytes: number;
    percent: number;
    bytesPerSecond: number;
    state: string;
    status: string;
    error?: string;
}
const DownloaderCache: Map<string, DownloadState> = new Map();
export default class Downloader {
    private id: string;
    constructor(id: string) {
        this.id = id;
    }
    static getItems() {
        return Array.from(DownloaderCache).map(row => row[1]);
    }

    updateState(param: DownloadState) {
        DownloaderCache.set(param.id, param);
    }
}
