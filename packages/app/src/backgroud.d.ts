interface BackgroundApi {
    writeText: (text: string) => Promise<void>;
    readText: () => Promise<string>;
    writeImage: (image: Electron.NativeImage) => Promise<void>;
    readImage: () => Promise<Electron.NativeImage>;
    platform: () => string;
    arch: () => string;
    node: () => string;
    chrome: () => string;
    electron: () => string;
    message: <Result>(message: {action:string,payload?:object}) => Promise<Result>;
}

interface AppApi {
    writeText: (text: string) => Promise<void>;
}

declare global {
    interface Window {
        backgroundApi: BackgroundApi;
    }
}

export { };

