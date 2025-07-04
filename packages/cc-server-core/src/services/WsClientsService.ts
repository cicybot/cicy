import { stringIsJson, waitForResult } from '@cc/utils/dist/common/utils';
import url from 'url';
import { WebSocketServer } from 'ws';
const { v4: uuid } = require('uuid');

const clients = new Map<string, WebSocket | any>();
const clientWebContentsId = new Map<string, number>();

export interface BrowserInfo {
    title?:string,
    favIcon?:string,
    state?:string,
    webContentsId:number,
    ts:number
}
export enum WsCloseCode {
    WS_CLOSE_STOP_RECONNECT = 3001,
    WS_CLOSE_RECONNECT = 3002
}
const MsgResult: Map<string, any> = new Map();
const BrowserInfoCache: Map<string, BrowserInfo> = new Map();

export class WsClientsService {
    private client: WebSocket;
    private clientId: string;
    constructor(clientId: string) {
        this.clientId = clientId;
        this.client = clients.get(clientId) as WebSocket;
    }
    isOnline() {
        return this.client!!;
    }
    sendMsg(content: string) {
        try {
            this.client.send(content);
        } catch (e) {
            console.error(e);
        }
    }
    createWindow({
        openDevTools,
        url,
        noWebview,
        windowId,
    }: {
        windowId: string;
        openDevTools?: boolean;
        url: string;
        noWebview?:boolean
    }) {
        if (!this.isOnline()) {
            throw new Error('WS Client is not Online');
        }
        this.sendAsync({
            action: 'createWindow',
            payload: {
                noWebview,
                windowId,
                openDevTools,
                url,
            }
        });
    }
    async sendSync(message: { action: string; payload?: any }, timeout = 3000) {
        if (!this.isOnline()) {
            throw new Error('WS Client is not Online');
        }
        const id = uuid();
        MsgResult.set(id, null);
        try {
            this.client.send(
                JSON.stringify({
                    ...message,
                    id
                })
            );
            const res = await waitForResult(() => {
                return MsgResult.get(id);
            }, timeout);
            MsgResult.delete(id);
            return res;
        } catch (e) {
            console.error(e);
            MsgResult.delete(id);
            return null;
        }
    }
    sendAsync(message: { action: string; payload: any }) {
        try {
            this.client.send(JSON.stringify(message));
        } catch (e) {
            console.error(e);
        }
    }

    sendRaw(message: string) {
        try {
            this.client.send(message);
        } catch (e) {
            console.error(e);
        }
    }
    static init(httpServer: any) {
        const wss = new WebSocketServer({
            server: httpServer,
            path: '/ws'
        });

        wss.on('connection', async (ws, req: Request) => {
            const t = url.parse(req.url, true).query.t as string;
            const clientId = url.parse(req.url, true).query.id as string;
            if (clients.has(clientId)) {
                clients
                    .get(clientId as string)
                    .close(WsCloseCode.WS_CLOSE_STOP_RECONNECT, 'WS_CLOSE_STOP_RECONNECT');
            }
            WsClientsService.addClient(clientId, ws);

            console.log(`Client connected : [${clientId}] ${t}`);
            ws.on('message', message => {
                console.log('[+] [REV]:',clientId, message.toString().trim());
                if (stringIsJson(message.toString())) {
                    const { id, action, payload } = JSON.parse(message.toString());
                
                    switch(action){
                        case "regWebContentsId":{
                            const {webContentsId} = payload
                            clientWebContentsId.set(clientId,webContentsId)
                            break
                        }
                        default:
                            break
                    }
                    if (
                        id &&
                        MsgResult.has(id) &&
                        MsgResult.get(id) === null &&
                        action === 'callRes'
                    ) {
                        MsgResult.set(id, payload);
                    }
                }
            });
            ws.on('close', () => {
                console.log(`Client disconnected : [${clientId}] ${t}`);
                if (ws === clients.get(clientId)) {
                    WsClientsService.delClient(clientId);
                    BrowserInfoCache.delete(clientId)
                }
                clientWebContentsId.delete(clientId)
            });
        });
    }
    static getClients() {
        return clients;
    }
    static getClientIds() {
        return Array.from(clients).map(row => row[0]);
    }
    static addClient(clientId: string, ws: WebSocket | any) {
        clients.set(clientId, ws);
    }
    static delClient(clientId: string) {
        clients.delete(clientId);
    }
    static hasClient(clientId: string) {
        return clients.has(clientId);
    }

    static hasWebContentsId(clientId: string) {
        if(!clients.has("ElectronMainWindow")){
            return false;
        }
        if(!clients.has(clientId)){
            return false;
        }
        return clientWebContentsId.has(clientId);
    }
    static getWebContentsId(clientId: string) {
        return clientWebContentsId.get(clientId);
    }

    setInfo(webContentsId:number,info:Partial<BrowserInfo>){
        const ts = Date.now()
        const cache = BrowserInfoCache.get(this.clientId)||{}
        BrowserInfoCache.set(this.clientId,{
            ...cache,
            ...info,
            ts,
            webContentsId
        })
    }
    getInfo(){
        return BrowserInfoCache.get(this.clientId)||{}
    }
}
