import { waitForResult } from '@cicy/utils';
import { v4 as uuidv4 } from 'uuid';

export enum WsCloseCode {
    WS_CLOSE_STOP_RECONNECT = 3001,
    WS_CLOSE_RECONNECT = 3002,
    WS_CLIENT_CLOSE_RECONNECT = 3003
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
        return this.send({
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
        return __serverUrl.replace('127.0.0.1', serverIp || '127.0.0.1');
    }

    static isLocalServer() {
        return DEFAULT_SERVER_URL === __serverUrl;
    }

    static getHttpUrl(serverIp: string) {
        return __serverUrl
            .replace('ws://', 'http://')
            .replace('/ws', '')
            .replace('127.0.0.1', serverIp);
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
//@ts-ignore
window.__setServerUrl = CCWSClient.setServerUrl;
export const connectCCServer = (clientId: string, options?: WsOptions) => {
    if (!__serverUrl) {
        setTimeout(() => {
            connectCCServer(clientId, options);
        }, 1000);
        return;
    }
    const serverUrl = __serverUrl;
    try {
        const url = `${serverUrl}?id=${clientId}&t=` + +new Date();
        __ws = new WebSocket(url);

        console.log('[+] connecting to ' + url);
        __ws.onopen = () => {
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
                } else {
                    options?.onMessage && options.onMessage(data);
                }
            }
        };

        __ws.onerror = e => {
            console.error('[-] Connection error', e);
        };
        __ws.onclose = e => {
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
