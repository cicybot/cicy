import { ClientIds } from '../services/cicy/CCWSClient';
import { onEvent } from './utils';
import { BackgroundApi } from '../services/common/BackgroundApi';
import ProxyService from '../services/common/ProxyService';
import { message } from 'antd';
import { BrowserAccount } from '../services/model/BrowserAccount';

export const isAndroidAgentRustClient = (clientId: string) => {
    return (
        clientId.startsWith('ADR-') &&
        !clientId.endsWith('-APP') &&
        !clientId.endsWith('-MANAGE') &&
        !clientId.endsWith('-CHAT')
    );
};

export const isAndroidAgentClient = (clientId: string) => {
    return clientId.startsWith('ADR-') && clientId.endsWith('-APP');
};

export const isAndroidChatClient = (clientId: string) => {
    return clientId.startsWith('ADR-') && clientId.endsWith('-CHAT');
};

export const isAndroidAgentManageClient = (clientId: string) => {
    return clientId.startsWith('ADR-') && clientId.endsWith('-MANAGE');
};

export const isBrowserClient = (clientId: string) => {
    const t = clientId.split('-');

    return t.length === 2 && parseInt(t[0]) >= 0 && t[1].length === 32;
};

export const isMainWindow = (clientId: string) => {
    return clientId === ClientIds.MainWindow;
};

export const isMainWebContent = (clientId: string) => {
    return clientId === ClientIds.MainWebContent;
};

export const isMasterWebContent = (clientId: string) => {
    return clientId.startsWith('MasterWebContent');
};

export const isConnector = (clientId: string) => {
    return clientId.startsWith('CONNECTOR-');
};
