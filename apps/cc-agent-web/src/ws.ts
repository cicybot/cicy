export function waitForResult(
    cb: () => any | Promise<any>,
    timeout: number = -1,
    interval: number = 100
): Promise<any | null> {
    const startTime = Date.now();

    return new Promise(resolve => {
        const checkReply = async () => {
            try {
                const res = await Promise.resolve(cb()); // Ensure cb result is a Promise
                if (res) {
                    resolve(res);
                    return;
                }

                // Check for timeout
                if (timeout > -1 && Date.now() - startTime > timeout) {
                    resolve({ err: 'ERR_TIMEOUT' });
                    return;
                }

                // Retry after interval
                setTimeout(checkReply, interval);
            } catch (error) {
                console.error('Error in waitForResult callback:', error);
                resolve({ err: `ERR:${error}` });
            }
        };

        checkReply();
    });
}

export enum WsCloseCode {
    WS_CLOSE_STOP_RECONNECT = 3001,
    WS_CLOSE_RECONNECT = 3002,
    WS_CLIENT_CLOSE_RECONNECT = 3003
}

export enum ClientIds {
    MainWebContent = 'MainWebContent',
    MainWindow = 'MainWindow'
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

let __serverUrl = localStorage.getItem('serverUrl') || 'ws://127.0.0.1:3101/ws';

let __ws: WebSocket | null;

export interface WsOptions {
    onOpen?: (ws: WebSocket) => void;
    onMessage?: (ws: WebSocket, message: string) => Promise<void>;
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
            __ws.send(message);
        } else {
            throw new Error('ws client state not open');
        }
    }

    async sendAction(action: string, payload: any) {
        return this.send({
            action,
            payload
        });
    }

    async getClients() {
        return this.send({
            action: '__clients'
        });
    }

    async send(
        msg: {
            action: string;
            payload?: object;
        },
        timeout = -1,
        interval = 100
    ) {
        try {
            const id = Date.now() + '.' + Math.floor(1000 * Math.random());
            MsgResult.set(id, false);
            CCWSClient._send(
                JSON.stringify({
                    ...msg,
                    to: this.clientId,
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

    static getServerUrl() {
        return __serverUrl;
    }

    static setServerUrl(serverUrl: string) {
        if (__serverUrl !== serverUrl) {
            __serverUrl = serverUrl;
            localStorage.setItem('serverUrl', __serverUrl);
            if (__ws && __ws.readyState === WebSocket.OPEN) {
                __ws.close(WsCloseCode.WS_CLOSE_STOP_RECONNECT, 'WS_CLOSE_STOP_RECONNECT');
            }
        }
    }
}

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
                console.log('onMessage', data);
            }
            if (stringIsJson(data)) {
                const { id, payload, action } = JSON.parse(data) as any;
                if (action === 'callback' && id) {
                    if (MsgResult.has(id)) {
                        MsgResult.set(id, payload);
                    }
                } else {
                    options?.onMessage && options.onMessage(__ws!, data);
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
