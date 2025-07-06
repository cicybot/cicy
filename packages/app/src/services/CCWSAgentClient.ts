import { arrayBufferToBase64 } from '../utils/utils';
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
    constructor(clientId: string) {
        super(clientId);
        this.accessibility = false;
        this.mediaProjection = false;
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

    async getScreen() {
        const { ipAddress, ccAgentMediaProjection, ccAgentAppRunning } = this.deviceInfo!;

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
}
