import {CCServerWebSocket,initExpressServer} from "@cc/cc-ws"

export async function initCCServer(publicPath:string){
    const port = 3101
    const httpServer = initExpressServer(port,{
        publicPath
    })
    const server = new CCServerWebSocket("127.0.0.1",port);
    server.init(httpServer)
    server.startServer()
}