import { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { CCWSMainWindowClient } from '../services/cicy/CCWSMainWindowClient';
import ProxyService from '../services/common/ProxyService';
import { BackgroundApi } from '../services/common/BackgroundApi';

export interface MainWindowAppInfo {
    appDir: string;
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
    version: string;
    isDev: boolean;
}
export interface MainWindowState {
    serverIp: string;
    appInfo: MainWindowAppInfo;
}

const MainWindowContext = createContext<MainWindowState>({} as MainWindowState);

export const MainWindowProvider = ({ children }: { children: ReactNode }) => {
    const { Provider } = MainWindowContext;
    const [serverIp, setServerIp] = useState(null);
    const [appInfo, setAppInfo] = useState(null);
    useEffect(() => {
        new BackgroundApi().mainWindowInfo().then((res: any) => {
            setAppInfo(res.result);
            ProxyService.init(res.result).catch(console.error);
        });

        new CCWSMainWindowClient().getServerInfo().then(res => {
            if (!res.err) {
                setServerIp(res.ip);
            }
        });
    }, []);

    return (
        <Provider value={{ appInfo: appInfo!, serverIp: serverIp! }}>
            {Boolean(appInfo && serverIp) && children}
        </Provider>
    );
};

export const useMainWindowContext = () => {
    const context = useContext(MainWindowContext);
    if (context === undefined) {
        throw new Error('useMainWindowContext must be used within a MainWindowProvider');
    }
    return context;
};
