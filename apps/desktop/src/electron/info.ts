interface AppInfo {
    publicDir: string;
    isWin: boolean;
    pathSep: string;
    ip: string;
    meta: {
        configPath: string;
        dataDir: string;
        bin: string;
    };
    appDataPath: string;
    userDataPath: string;
    appDir: string;
    version: string;
    isDev: boolean;
}
let __info: AppInfo | null = null;
export function setAppInfo(info: Partial<AppInfo>) {
    __info = {
        ...__info,
        ...info
    };
}

export function getAppInfo() {
    return __info!;
}
