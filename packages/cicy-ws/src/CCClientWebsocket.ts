
import WebSocket from 'ws';
export interface MsgHandler{
    onMessage:(ws:WebSocket,data:string)=>Promise<void>,
    onOpen?:(ws:WebSocket)=>void;
    onClose?:(ws:WebSocket,code:number)=>void;
}
let __clientId = ""
let __serverUrl = ""
let __ws:WebSocket | null;
let __msgHandler:MsgHandler | null = null

export enum WsCloseCode {
    WS_CLOSE_STOP_RECONNECT = 3001,
    WS_CLOSE_RECONNECT = 3002,
    WS_CLIENT_CLOSE_RECONNECT = 3003
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


const setServerUrl = async (serverUrl:string) => {
    if(__serverUrl !== serverUrl){
        __serverUrl = serverUrl
        if(__ws && __ws.readyState === WebSocket.OPEN){
            __ws.close(WsCloseCode.WS_CLOSE_STOP_RECONNECT,"WS_CLOSE_STOP_RECONNECT")
        }
    }
};

const connectCCServer = () => {
    if(!__serverUrl){
        console.warn("serverUrl not set")
        setTimeout(()=>{connectCCServer()}, 1000);
        return;
    }
    if(!__clientId){
        console.warn("clientId not set")
        setTimeout(()=>{connectCCServer()}, 1000);
        return;
    }
    const serverUrl = __serverUrl
    try {
        const url = `${serverUrl}?id=${__clientId}&t=` + +new Date();
        __ws = new WebSocket(url);

        console.log('[+] connecting to ' + url);
        __ws.onopen = () => {
            console.log('[+] connected to ' + url);
            Boolean(__msgHandler && __msgHandler.onOpen) && __msgHandler!.onOpen!(__ws!)
        };
        __ws.onmessage = async e => {
            const { data } = e;
            if (isString(data)) {
                console.log('[RCV]', data);
            }
            if (stringIsJson(data)) {
                Boolean(__msgHandler && __msgHandler.onMessage) && __msgHandler!.onMessage(__ws!, data as string)
            }
        };

        __ws.onerror = e => {
            console.error('[-] Connection error', e.error.code);
            if ('ECONNREFUSED' === e.error.code) {
                console.log('[-] Error url:', url);
            }
        };
        __ws.onclose = e => {
            Boolean(__msgHandler && __msgHandler.onClose) && __msgHandler!.onClose!(__ws!,e.code)
            console.log('[-] on close', e.code);
            if (WsCloseCode.WS_CLOSE_STOP_RECONNECT !== e.code) {
                setTimeout(()=>{connectCCServer()}, 1000);
            }else{
                __ws = null
            }
        };
    } catch (e) {
        //@ts-ignore
        console.error("connectCCServer error",e.message);
        setTimeout(()=>{connectCCServer()}, 1000);
    }
};

export class CCClientWebsocket {
    static setServerUrl(serverUrl:string){
        setServerUrl(serverUrl)
    }
    static configServer(serverUrl:string,clientId:string,msgHandler:MsgHandler){
        setServerUrl(serverUrl)
        __clientId = clientId
        __msgHandler = msgHandler
        return CCClientWebsocket
    }
    static connectCCServer(){
        connectCCServer()
    }

}

