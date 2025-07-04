import { ClientIds } from "../services/CCWSClient";


export const isAdroidAgentRustClient = (clientId: string) => {
    return clientId.startsWith('ADR-') && !clientId.endsWith('-APP') && !clientId.endsWith('-MANAGE');
};

export const isAdroidAgentClient = (clientId: string) => {
    return clientId.startsWith('ADR-') && clientId.endsWith('-APP');
};

export const isAdroidAgentManageClient = (clientId: string) => {
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

export const isClientAdr = (clientId: string) => {
    return clientId.startsWith("CONNECTOR-ADR-")
};
