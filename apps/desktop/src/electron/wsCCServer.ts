import { CCServerWebSocket, initExpressServer, isPortOnline, killPort } from '@cicy/cicy-ws';
import { exec } from 'child_process';
import util from 'util';
import path from 'path';
import { getAppInfo } from './info';
import fs from 'fs';
import * as os from 'os';

const execPromise = util.promisify(exec);

export async function initCCServer(ip = '0.0.0.0', port = 4444, rust?: boolean) {
    const { publicDir, userDataPath: userDataPath1, version, isDev } = getAppInfo();

    if (!rust) {
        const httpServer = initExpressServer(port, {
            publicPath: publicDir
        });
        const server = new CCServerWebSocket(ip, port);
        server.init(httpServer);
        server.startServer();
    } else {
        const portOnline = await isPortOnline(port);
        if (portOnline) {
            await killPort(port);
        }
        const platform = process.platform;
        const arch = process.arch;
        const prefix = platform === 'win32' ? '.exe' : '';
        const ver = isDev ? '0.0.0' : version;
        const serverName = `cicy-server-${ver}-${platform}-${arch}${prefix}`;

        const userDataPath =
            platform === 'win32' ? userDataPath1 : path.join(os.homedir(), '.cicy');

        const assetsDir = path.join(publicDir, 'static', 'assets');
        const serverPath = path.join(assetsDir, serverName);
        if (!fs.existsSync(path.join(userDataPath, 'app'))) {
            fs.mkdirSync(path.join(userDataPath, 'app'), { recursive: true });
        }
        const pathCmd = path.join(userDataPath, 'app', serverName);
        if (!fs.existsSync(pathCmd)) {
            fs.copyFileSync(serverPath, pathCmd);
            if (platform !== 'win32') {
                await execPromise(`chmod +x "${pathCmd}"`);
            }
        }
        const cmd = `"${pathCmd}" --assets-dir "${assetsDir}" --port ${port} --ip ${ip} -d`;

        console.log('initCCServer rust: ', {
            platform,
            arch,
            assetsDir,
            userDataPath,
            ip,
            port,
            ver,
            cmd
        });
        await execPromise(cmd);
        const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
        //@ts-ignore
        while (true) {
            if (await isPortOnline(port)) {
                break;
            }
            await sleep(100);
        }
    }
}
