import isDev from 'electron-is-dev';

interface AppInfo {
    publicDir: string;
    appDataPath: string;
    userDataPath: string;
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
