import { CCServerWebSocket, initExpressServer, isPortOnline, killPort } from '@cicy/cicy-ws';
import { exec } from 'child_process';
import util from 'util';
import path from 'path';
import { getAppInfo } from './info';

const execPromise = util.promisify(exec);

export async function initCCServer(ip = '0.0.0.0', port = 4444, rust?: boolean) {
    const { publicDir, userDataPath, version, isDev } = getAppInfo();

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
        const serverFile = `cicy-server-${ver}-${platform}-${arch}${prefix}`;

        const assetsDir = path.join(publicDir, 'static', 'assets');
        const cmd = `${path.join(
            assetsDir,
            serverFile
        )} --dir "${userDataPath}" --assets-dir "${assetsDir}" --port ${port} --ip ${ip} -d`;

        console.log('initCCServer rust: ', {
            platform,
            arch,
            serverFile,
            assetsDir,
            userDataPath,
            ip,
            port,
            ver,
            cmd
        });

        await execPromise(cmd);
    }
}
