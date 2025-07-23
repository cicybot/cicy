import { waitForResult } from '@cicy/utils';
import { v4 as uuidv4 } from 'uuid';

export enum WsCloseCode {
    WS_CLOSE_STOP_RECONNECT = 3001,
    WS_CLOSE_RECONNECT = 3002,
    WS_CLIENT_CLOSE_RECONNECT = 3003
}

export function getMainWindowClientId() {
    let clientId = localStorage.getItem('MasterWebContentClientId') || '';
    if (!clientId) {
        clientId = `MasterWebContent-${navigator.platform}-` + Date.now();
        localStorage.setItem('MasterWebContentClientId', clientId);
    }
    return clientId;
}

export enum ClientIds {
    MainWebContent = 'MainWebContent',
    MainWindow = 'MainWebContent'
}

export const isString = (data: any) => {
    return typeof data === 'string';
};

export const stringIsJson = (data: any) => {
    if (!data || typeof data !== 'string') {
        return false;
    }
    return (
        (data.startsWith('{') && data.endsWith('}')) || (data.startsWith('[') && data.endsWith(']'))
    );
};
export const DEFAULT_SERVER_URL = 'ws://127.0.0.1:4444/ws';
let __serverUrl = localStorage.getItem('serverUrl') || DEFAULT_SERVER_URL;

let __ws: WebSocket | null;

export interface WsOptions {
    onOpen?: (ws: WebSocket) => void;
    onLogged: (ws: WebSocket) => void;
    onMessage?: (message: string) => void;
    onClose?: (ws: WebSocket, code: number) => void;
}

const MsgResult: Map<string, any> = new Map();

export class CCWSClient {
    public clientId: string;

    constructor(clientId: string) {
        this.clientId = clientId;
    }

    static _send(message: string) {
        if (__ws && __ws.readyState === WebSocket.OPEN) {
            console.debug('[+] [SEND] ' + message);
            __ws.send(message);
        } else {
            throw new Error('ws client state not open');
        }
    }

    async sendAction(action: string, payload?: any) {
        return await this.send({
            action,
            payload: payload || {}
        });
    }

    async isOnline(clientId: string) {
        const { isOnline, ...other } = await this.send({
            clientId: '',
            action: '__isOnline',
            payload: { clientId }
        });
        return !!isOnline;
    }

    async getClients() {
        return this.send({
            action: '__clients',
            clientId: ''
        });
    }

    async getServerInfo() {
        return this.send({
            action: '__info',
            clientId: ''
        });
    }

    async send(
        msg: {
            action: string;
            clientId?: string;
            payload?: object;
        },
        timeout = -1,
        interval = 100
    ) {
        try {
            const waitRes = await CCWSClient.waitForIsLogged();
            if (!waitRes) {
                throw new Error('login error or timeout');
            }
            const id = uuidv4();
            MsgResult.set(id, false);
            CCWSClient._send(
                JSON.stringify({
                    ...msg,
                    to: msg.clientId !== undefined ? msg.clientId : this.clientId,
                    id
                })
            );
            const res = await waitForResult(
                () => {
                    return MsgResult.get(id);
                },
                timeout,
                interval
            );
            MsgResult.delete(id);
            return res;
        } catch (e) {
            //@ts-ignore
            const err = e.message;
            return {
                err
            };
        }
    }

    sendWithoutResult(message: { id?: string; action: string; payload?: object; to?: string }) {
        CCWSClient._send(
            JSON.stringify({
                ...message,
                to: this.clientId
            })
        );
    }

    static getServerUrl(serverIp?: string) {
        return __serverUrl;
    }

    static formatServerUrl(ip: string) {
        const url = CCWSClient.getServerUrl();
        const t = url.split('://');
        const t2 = t[1].split(':');
        return `${t[0]}://${ip}:${t2.slice(1).join(':')}`;
    }

    static isLocalServer() {
        return __serverUrl.indexOf('127.0.0.1') > -1;
    }

    static getHttpUrl(serverIp: string) {
        return __serverUrl
            .replace('ws://', 'http://')
            .replace('/ws', '')
            .replace('127.0.0.1', serverIp);
    }

    static isLogged() {
        return isLogged;
    }

    static async waitForIsLogged() {
        if (isLogged) {
            return true;
        }
        const res = await waitForResult(() => {
            return {
                isLogged
            };
        });
        return res.isLogged;
    }

    static _setServerUrl(serverUrl: string) {
        __serverUrl = serverUrl;
    }

    static setServerUrl(serverUrl: string) {
        console.log('setServerUrl', {
            serverUrl,
            __serverUrl
        });
        window.backgroundApi &&
            window.backgroundApi.message({
                action: 'connectCCServer',
                payload: { serverUrl }
            });
        if (__serverUrl !== serverUrl) {
            __serverUrl = serverUrl;
            localStorage.setItem('serverUrl', __serverUrl);

            if (__ws && __ws.readyState === WebSocket.OPEN) {
                __ws.close(WsCloseCode.WS_CLOSE_STOP_RECONNECT, 'WS_CLOSE_STOP_RECONNECT');
            }
        }
    }
}

let isLogged = false;
export const connectCCServer = (clientId: string, options?: WsOptions) => {
    isLogged = false;
    if (!__serverUrl) {
        setTimeout(() => {
            connectCCServer(clientId, options);
        }, 1000);
        return;
    }
    const serverUrl = __serverUrl;
    try {
        const [cleanUrl, token] = serverUrl.split('?');

        const url = `${cleanUrl}?id=${clientId}&t=` + +new Date();
        __ws = new WebSocket(url);

        console.log('[+] connecting to ' + url);
        __ws.onopen = () => {
            if (token) {
                __ws!.send(
                    JSON.stringify({
                        action: 'login',
                        payload: {
                            token: token.replace('token=', '')
                        }
                    })
                );
            } else {
                isLogged = true;
            }
            console.log('[+] connected to ' + url);
            options?.onOpen && options.onOpen(__ws!);
        };
        __ws.onmessage = async e => {
            const { data } = e;
            if (isString(data)) {
                console.debug('[+] [REV]', data);
            }
            if (stringIsJson(data)) {
                const { id, payload, action } = JSON.parse(data) as any;
                if (action === 'callback' && id) {
                    if (MsgResult.has(id)) {
                        MsgResult.set(id, payload);
                    }
                } else if (action === 'logged') {
                    isLogged = true;
                    options?.onLogged && options.onLogged(__ws!);
                } else if (action === 'logout') {
                    isLogged = false;
                    window.dispatchEvent(new CustomEvent('goLogin'));
                } else {
                    isLogged && options?.onMessage && options.onMessage(data);
                }
            }
        };

        __ws.onerror = e => {
            console.error('[-] Connection error', e);
        };
        __ws.onclose = e => {
            isLogged = false;
            console.log('[-] on close', e.code);
            options?.onClose && options.onClose(__ws!, e.code);
            if (WsCloseCode.WS_CLOSE_STOP_RECONNECT !== e.code) {
                setTimeout(() => {
                    connectCCServer(clientId, options);
                }, 1000);
            } else {
                __ws = null;
            }
        };
    } catch (e) {
        //@ts-ignore
        console.error('connectCCServer error', e.message);
        setTimeout(() => {
            connectCCServer(clientId, options);
        }, 1000);
    }
};
