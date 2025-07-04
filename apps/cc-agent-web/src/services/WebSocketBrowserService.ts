import { isString, stringIsJson } from '../utils/utils';
import { WsCloseCode } from '../utils/ws';
import { AtxService } from './AtxService';

let ws: WebSocket;
export const connectServer = (clientId: string) => {
    try {
        const url = `ws://${location.host.split(':')[0]}:3101/ws?id=${clientId}&t=` + +new Date();
        ws = new WebSocket(url);
        console.log('[+] connecting to ' + url);
        ws.onopen = () => {
            console.log('[+] connected to ' + url);
            ws.send(
                JSON.stringify({
                    action: 'regAtx',
                    payload: {}
                })
            );
            setInterval(() => {
                ws.send(
                    JSON.stringify({
                        action: 'ping',
                        payload: {}
                    })
                );
            }, 2000);
        };
        ws.onmessage = async e => {
            const { data } = e;
            if (isString(data)) {
                console.log('onMessage', data);
            }
            if (stringIsJson(data)) {
                const service = new AtxService();
                service.handleMessage(ws, data as string);
            }
        };

        ws.onerror = e => {
            console.error('[-] Connection error', e);
        };
        ws.onclose = e => {
            console.log('[-] on close', e.code);
            if (WsCloseCode.WS_CLOSE_STOP_RECONNECT !== e.code) {
                setTimeout(() => connectServer(clientId), 1000);
            }
        };
    } catch (e) {
        console.error(e);
        setTimeout(() => connectServer(clientId), 1000);
    }
};
