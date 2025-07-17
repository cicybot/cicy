import { BackgroundApi } from './BackgroundApi';

export const DEFAULT_SCRIPT = `
def request(flow):
    print("[+] [REQ]",flow.request.url)
`;
export default class ProxyMitmService {
    private readonly userDataDir: string;
    private readonly isWin: boolean;
    private useWebUI?: boolean;

    constructor(userDataDir: string, isWin: boolean) {
        this.userDataDir = userDataDir;
        this.isWin = isWin;
    }

    setWebUI() {
        this.useWebUI = true;
    }

    async startServer(port: number, forwardPort: number, showWin?: boolean) {
        const res = await new BackgroundApi().openTerminal(this.getCmd(port, forwardPort), showWin);
        return res.result;
    }

    async isPortOnline(port: number) {
        const res = await new BackgroundApi().isPortOnline(port);
        return res.result;
    }

    async killPort(port: number) {
        await new BackgroundApi().killPort(port);
    }

    getCmd(port: number, forwardPort: number) {
        return `${
            this.useWebUI ? 'mitmweb' : 'mitmdump'
        } -s ${this.getPath()} --listen-port ${port} --mode upstream:http://127.0.0.1:${forwardPort}`;
    }

    getPath() {
        return `${this.userDataDir}${this.isWin ? '\\' : '/'}script_forward.py`;
    }

    async initScript() {
        const path = this.getPath();
        const res = await new BackgroundApi().utils({
            method: 'fileExists',
            params: [path]
        });
        if (!res.result) {
            await new BackgroundApi().utils({
                method: 'fileWriteString',
                params: [path, DEFAULT_SCRIPT]
            });
            return DEFAULT_SCRIPT.trim();
        } else {
            const res = await new BackgroundApi().utils({
                method: 'fileReadString',
                params: [path]
            });
            return res.result.trim();
        }
    }

    async saveScript(content: string) {
        await new BackgroundApi().utils({
            method: 'fileWriteString',
            params: [this.getPath(), content]
        });
    }
}
