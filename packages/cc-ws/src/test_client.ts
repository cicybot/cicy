import {CCClientWebsocket} from "./CCClientWebsocket"
import WebSocket from 'ws';

CCClientWebsocket.configServer(
    "ws://127.0.0.1:3101/ws",
    "TEST-CLIENT",
    {
        onOpen:(ws:WebSocket)=>{
            ws.send(JSON.stringify({
                id:Date.now()+"."+Math.floor(Math.random()  *1000),
                action:"ping"
            }))

            ws.send(JSON.stringify({
                id:Date.now()+"."+Math.floor(Math.random()  *1000),
                action:"__info"
            }))

            ws.send(JSON.stringify({
                id:Date.now()+"."+Math.floor(Math.random()  *1000),
                action:"__isOnline",
                payload:{
                    clientId:"test"
                }
            }))

            ws.send(JSON.stringify({
                id:Date.now()+"."+Math.floor(Math.random()  *1000),
                action:"__clients",
            }))

            ws.send(JSON.stringify({
                id:Date.now()+"."+Math.floor(Math.random()  *1000),
                to:"ADR-Redmi-2409BRN2CC",
                action:"jsonrpc",
                payload:{
                    method:"deviceInfo",
                    params:[]
                }
            }))

            ws.send(JSON.stringify({
                id:Date.now()+"."+Math.floor(Math.random()  *1000),
                to:"ADR-Redmi-2409BRN2CC",
                action:"jsonrpc",
                payload:{
                    method:"shell",
                    params:["pwd"]
                }
            }))


            ws.send(JSON.stringify({
                id:Date.now()+"."+Math.floor(Math.random()  *1000),
                to:"ADR-Redmi-2409BRN2CC",
                action:"jsonrpc",
                payload:{
                    method:"ping",
                    params:[]
                }
            }))
            setInterval(()=>{
                ws.send(JSON.stringify({
                    id:Date.now()+"."+Math.floor(Math.random()  *1000),
                    to:"ADR-Redmi-2409BRN2CC-2",
                    action:"jsonrpc",
                    payload:{
                        method:"ping",
                        params:[]
                    }
                }))
            },1000)

            setInterval(()=>{
                ws.send(JSON.stringify({
                    id:Date.now()+"."+Math.floor(Math.random()  *1000),
                    to:"ADR-Redmi-2409BRN2CC-1",
                    action:"jsonrpc",
                    payload:{
                        method:"ping",
                        params:[]
                    }
                }))
            },1000)
        },
        onMessage:async (ws:WebSocket,data:string)=>{
            const { id, action, payload,from:fromClientId } = JSON.parse(data as string);
            if(action === "callback"){
                return;
            }
            let res:any = {err:""};
            try {
                switch (action) {
                    default:
                        break;
                }
            } catch (e) {
                console.error(e);
                //@ts-ignore
                res = {err:e.message};
            }
            if (id && fromClientId) {
                ws.send(
                    JSON.stringify({
                        id,
                        to:fromClientId,
                        action: 'callback',
                        payload: res
                    })
                );
            }
        }
    }
).connectCCServer()
