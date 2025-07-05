import {CCServerWebSocket,initExpressServer,isPortOnline,killPort} from "@cicy/cicy-ws"
import { exec } from 'child_process';
import util from "util"
import path from "path"

const execPromise = util.promisify(exec)

export async function initCCServer(publicPath:string,version = "0.0.0" ,ip = "0.0.0.0",port=4444,rust?:boolean){
    if(!rust){
        const httpServer = initExpressServer(port,{
            publicPath
        })
        const server = new CCServerWebSocket(ip,port);
        server.init(httpServer)
        server.startServer()
    }else{
        const portOnline = await isPortOnline(port)
        if(portOnline){
            await killPort(port)
        }
        const platform = process.platform
        const arch = process.arch        
        let prefix = platform === 'win32' ? ".exe":""
        const serverFile = `cicy-server-${version}-${platform}-${arch}${prefix}`
        console.log("initCCServer rust: ",{platform,arch,serverFile,ip,port,version});
        await execPromise(`${path.join(publicPath,"static/assets",serverFile)} --port ${port} --ip ${ip} -d`)
    }
    
}