import url from 'url';
import {v4 as uuid} from 'uuid';
import {waitForResult} from '@cicy/utils'
import { WebSocketServer } from 'ws';
import { createServer, Server } from 'http';
import { getLocalIPAddress, isPortOnline, killPort } from './utils';

const CLIENTS = new Map<string, WebSocket | any>();
const SERVER_CLIENT_ID = "__SERVER"
export enum WsCloseCode {
    WS_CLOSE_STOP_RECONNECT = 3001,
    WS_CLOSE_RECONNECT = 3002
}
const MsgResult: Map<string, any> = new Map();

export class CCServerWebSocket {
    private port:number;
    private host:string;
    private path:string;
    private httpServer?:Server;
    constructor(host:string,port: number,path?:string) {
        this.host = host;
        this.port = port;
        this.path = path||"ws";
    }
    async startServer(){
        if(await isPortOnline(this.port)){
            console.log("port is online,kill it")
            try {
                await killPort(this.port)
            } catch (error) {
                console.error(error)
            }
        }
        this.httpServer?.listen(this.port,this.host, () => {
            console.log(`[+] WS Server running on ws://${this.host}:${this.port}/${this.path}`)
        });
    }
    init(httpServer?: any) {
        if(!httpServer){
            httpServer = createServer()
        }
        this.httpServer = httpServer
        const wss = new WebSocketServer({
            server: httpServer,
            path: '/ws'
        });

        wss.on('connection', async (ws:any, req: Request) => {
            const t = url.parse(req.url, true).query.t as string;
            const clientId = url.parse(req.url, true).query.id as string;
            if (CLIENTS.has(clientId)) {
                CLIENTS
                    .get(clientId as string)
                    .close(WsCloseCode.WS_CLOSE_STOP_RECONNECT, 'WS_CLOSE_STOP_RECONNECT');
            }
            CCServerWebSocket.addClient(clientId, ws);

            console.log(`Client connected : [${clientId}] ${t}`);
            ws.on('message', (message:any) => {
                console.log('[+] [REV]:',clientId, message.toString().trim());
                const msg = message.toString()
                if (msg.startsWith("{")) {
                    const { id, action, payload,to } = JSON.parse(msg);
                    if(to === SERVER_CLIENT_ID && action === "callback" && id){
                        MsgResult.set(id,payload)
                        return;
                    }
                    switch (action){
                        case "ping":{
                            ws.send(JSON.stringify({
                                id,
                                action:"pong"
                            }))
                            break
                        }
                        case "__info":{
                            const ip = getLocalIPAddress()
                            ws.send(JSON.stringify({
                                id,
                                action:"callback",
                                payload:{
                                    ip
                                }
                            }))
                            break
                        }
                        case "__isOnline":{
                            ws.send(JSON.stringify({
                                id,
                                action:"callback",
                                payload:{
                                    isOnline:CCServerWebSocket.hasClient(payload.clientId)
                                }
                            }))
                            break
                        }
                        case "__clients":{
                            ws.send(JSON.stringify({
                                id,
                                action:"callback",
                                payload:{
                                    clients:CCServerWebSocket.getClientIds()
                                }
                            }))
                            break
                        }
                        default:
                            if(to){
                                if(CCServerWebSocket.hasClient(to)){
                                    const client = CCServerWebSocket.getClient(to)
                                    client.send(JSON.stringify(({
                                        from:clientId,
                                        id,action,payload
                                    })))
                                }else{
                                    ws.send(JSON.stringify({
                                        id,
                                        action:"callback",
                                        payload:{
                                            err:"toClientId not exsits"
                                        }
                                    }))
                                }
                            }else{
                                ws.send(JSON.stringify({
                                    id,
                                    action:"callback",
                                    payload:{
                                        err:"error request"
                                    }
                                }))
                            }
                            break
                    }

                }
            });
            ws.on('close', () => {
                console.log(`Client disconnected : [${clientId}] ${t}`);
                if (ws === CLIENTS.get(clientId)) {
                    CCServerWebSocket.delClient(clientId);
                }
            });
        });
        return httpServer;
    }
    
    static async send(clientId:string,message:object,timeout = 300000){
        const client = CCServerWebSocket.getClient(clientId)
        if (!client) {
            throw new Error('WS Client is not Online');
        }
        const id = uuid();
        MsgResult.set(id, false);
        try {
            client.send(
                JSON.stringify({
                    ...message,
                    from:SERVER_CLIENT_ID,
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
    static getClients() {
        return CLIENTS;
    }
    static getClientIds() {
        return Array.from(CLIENTS).map(row => row[0]);
    }
    static addClient(clientId: string, ws: WebSocket | any) {
        CLIENTS.set(clientId, ws);
    }
    static delClient(clientId: string) {
        CLIENTS.delete(clientId);
    }
    static hasClient(clientId: string) {
        return CLIENTS.has(clientId);
    }

    static getClient(clientId: string) {
        return CLIENTS.get(clientId);
    }
}
