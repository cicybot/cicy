import { arrayBufferToBase64 } from '../../utils/utils';
import { sleep } from '@cicy/utils';

import { CCWSClient } from './CCWSClient';

export interface DeviceInfo {
    abi: string;
    agentRustVersion: string;
    brand: string;
    ccAgentAccessibility: boolean;
    ccAgentAppInstalled: boolean;
    ccAgentMediaProjection: boolean;
    ccAgentAppRunning: boolean;
    ccAgentRustPid: string;
    ccAgentAppUploaded: boolean;
    clientId: string;
    dpi: string;
    ipAddress: string;
    isRoot: boolean;
    model: string;
    serverUrl: string;
    size: string;
}

export default class CCWSAgentClient extends CCWSClient {
    accessibility: boolean;
    mediaProjection: boolean;
    deviceInfo?: DeviceInfo;
    appInfo?: any;
    isApp?: boolean;
    constructor(clientId: string) {
        super(clientId);
        this.accessibility = false;
        this.mediaProjection = false;
    }

    setAppInfo(appInfo: any) {
        this.appInfo = appInfo;
    }

    isInApp(isApp: boolean) {
        this.isApp = isApp;
    }
    setDeviceInfo(deviceInfo: DeviceInfo) {
        this.deviceInfo = deviceInfo;
    }

    isAccessibilityEnabled() {
        return (
            this.deviceInfo &&
            this.deviceInfo.ccAgentAppRunning &&
            this.deviceInfo.ccAgentAccessibility
        );
    }

    isRoot() {
        return this.deviceInfo && this.deviceInfo.isRoot;
    }

    isNotRootAndNoAccessibilityEnabled() {
        return !this.isRoot() && !this.isAccessibilityEnabled();
    }

    isMediaProjectionEnabled() {
        return (
            this.deviceInfo &&
            this.deviceInfo.ccAgentAppRunning &&
            this.deviceInfo.ccAgentMediaProjection
        );
    }

    pressKey(key: string) {
        if (this.isAccessibilityEnabled()) {
            return this.getAppClient().jsonrpc('pressKey', [key]);
        } else {
            return this.shellInputPress(key);
        }
    }

    inputText(text: string) {
        if (this.isAccessibilityEnabled()) {
            return this.getAppClient().jsonrpc('inputText', [text]);
        } else {
            return this.shellInputText(text);
        }
    }

    click(x: number, y: number) {
        if (this.isAccessibilityEnabled()) {
            return this.getAppClient().jsonrpc('click', [x, y]);
        } else {
            return this.shellInputTap(x, y);
        }
    }

    getAppClient() {
        return new CCWSAgentClient(`${this.clientId}-APP`);
    }

    async _action(action: string, payload?: {}) {
        const res = await this.sendAction(action, payload || {});
        if (res.err) {
            throw new Error(`Error send action:${action},${res.err}`);
        }
        return res.result || res;
    }

    async shell(cmd: string) {
        return this.jsonrpc('shell', [cmd]);
    }

    async startMediaProjection() {
        return this.jsonrpcApp('startMediaProjection');
    }

    async startAccessibility() {
        return this.jsonrpcApp('startAccessibility');
    }

    async startAgentApp() {
        return this.jsonrpc('shell', [
            'am start -n com.cc.agent.adr/com.web3desk.adr.MainActivity'
        ]);
    }

    async stopAgentApp() {
        await this.shell('am force-stop com.cc.agent.adr');
    }

    async restartAgentApp() {
        await this.stopAgentApp();
        await this.startAgentApp();
    }

    async shellInput(args: string) {
        const cmd = `input ${args}`;
        return this.jsonrpc('shell', [cmd]);
    }

    async shellInputTap(x: number, y: number) {
        const cmd = `input tab ${x} ${y}`;
        return this.jsonrpc('shell', [cmd]);
    }

    async shellInputText(text: string) {
        const cmd = `input text ${text}`;
        return this.jsonrpc('shell', [cmd]);
    }

    async shellInputPress(key: string) {
        const cmd = `input press ${key}`;
        return this.jsonrpc('shell', [cmd]);
    }

    async download(url: string, savePath: string) {
        return this.jsonrpc('download', [url, savePath]);
    }

    async readFile(path: string) {
        return this.jsonrpc('readFile', [path]);
    }

    async writeFile(path: string, content: string) {
        return this.jsonrpc('writeFile', [path, content]);
    }

    async jsonrpcApp(method: string, params?: any[]) {
        return this.getAppClient()._action('jsonrpc', {
            method,
            params: typeof params === 'string' ? [params] : params || []
        });
    }

    async jsonrpc(method: string, params?: any[]) {
        return this._action('jsonrpc', {
            method,
            params: typeof params === 'string' ? [params] : params || []
        });
    }

    async getScreenFromScreencap() {
        await this.shell('screencap /data/local/tmp/screen.png');
        const res = await this.shell('base64 -i /data/local/tmp/screen.png');
        return `data:image/png;base64,${res}`;
    }

    isIpTheSaveSection(ip1: string, ip2: string) {
        const sectionIp = (ip: string) => {
            const t = ip.split('.');
            return `${t[0]}.${t[1]}`;
        };
        return sectionIp(ip1) === sectionIp(ip2);
    }

    async getScreen() {
        const { ip } = this.appInfo || {};
        const { ipAddress, ccAgentMediaProjection, ccAgentAppRunning } = this.deviceInfo!;
        if (this.isIpTheSaveSection(ip, ipAddress)) {
            if (ccAgentAppRunning && ccAgentMediaProjection) {
                const res = await fetch(`http://${ipAddress}:4448/screen`);
                const { result } = await res.json();
                const { imgData, xml: hierarchy } = result;
                return { imgData, hierarchy };
            } else {
                const res = await fetch(`http://${ipAddress}:4447/screen`);
                const arrayBuffer = await res.arrayBuffer();
                const imgData = `data:image/png;base64,${await arrayBufferToBase64(arrayBuffer)}`;
                return {
                    imgData,
                    hierarchy: ''
                };
            }
        } else {
            if (ccAgentAppRunning && ccAgentMediaProjection) {
                let { imgData, imgLen, xml: hierarchy } = await this.jsonrpcApp('screenWithXml');
                if (imgLen === 0) {
                    imgData = '';
                }
                return { imgData, hierarchy };
            } else {
                const imgData = await this.getScreenFromScreencap();
                await sleep(200);
                return {
                    imgData,
                    hierarchy: ''
                };
            }
        }
    }

    async getDeviceInfo(): Promise<DeviceInfo> {
        const deviceInfo = await this.jsonrpc('deviceInfo');
        this.deviceInfo = deviceInfo;
        return deviceInfo;
    }

    async isOnline() {
        const res = await super.isOnline(this.clientId);
        return !!res;
    }
    async getVpnStatus() {
        let { err, config, allowList, isVpnRunning } = await new CCWSAgentClient(
            this.clientId
        ).jsonrpcApp('vpnStatus');
        let proxyNode = '';
        if (!err) {
            config = config.trim();
            const nodeRegex = /Node\s*=\s*([^\n]+)/;
            const nodeMatch = config.match(nodeRegex);

            if (nodeMatch) {
                proxyNode = nodeMatch[1].trim();
            }
        }
        if (!allowList) {
            allowList = '';
        }
        return {
            allowList: allowList.split('|').filter((row: string) => !!row),
            proxyNode,
            isVpnRunning: !!isVpnRunning
        };
    }
    async getCurrentPackage() {
        const res = this.shell(
            'dumpsys activity activities | grep -E "mResumedActivity|mCurrentFocus"'
        );
    }
}
