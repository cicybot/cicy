import { CCWSClient } from './CCWSClient';
import { MainWindowAppInfo } from '../../providers/MainWindowProvider';

export interface DeviceInfo {
    abi: string;
    agentVersion: string;
    brand: string;
    inputIsReady: boolean;
    agentAppInstalled: boolean;
    recordingIsReady: boolean;
    agentAppRunning: boolean;
    agentPid: string;
    agentAppUploaded: boolean;
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
    _agentAppInfo?: any;
    appInfo?: any;
    isApp?: boolean;

    constructor(clientId: string) {
        super(clientId + '-APP');
        this.accessibility = false;
        this.mediaProjection = false;
    }

    setAppInfo(appInfo: MainWindowAppInfo) {
        this.appInfo = appInfo;
    }

    agentAppInfo() {
        return this._agentAppInfo;
    }

    setAgentAppInfo(appInfo: any) {
        this._agentAppInfo = appInfo;
    }

    isInApp(isApp: boolean) {
        this.isApp = isApp;
    }

    setDeviceInfo(deviceInfo: DeviceInfo) {
        this.deviceInfo = deviceInfo;
    }

    inputIsReady() {
        return this.agentAppInfo().inputIsReady;
    }

    isRoot() {
        return this.deviceInfo && this.deviceInfo.isRoot;
    }

    pressKey(key: string) {
        return this.jsonrpcApp('pressKey', [key]);
    }

    inputText(text: string) {
        return this.jsonrpcApp('inputText', [text]);
    }

    click(x: number, y: number) {
        return this.jsonrpcApp('click', [x, y]);
    }

    async _action(action: string, payload?: {}) {
        const res = await this.sendAction(action, payload || {});
        if (res.err) {
            throw new Error(`Error send action:${action},${res.err}`);
        }
        return res.result || res;
    }

    async shell(cmd: string) {
        return this.jsonrpcApp('shell', [cmd]);
    }

    async startAgentApp() {
        return this.jsonrpcApp('shell', [
            'am start -n com.cicy.agent.alpha/com.github.kr328.clash.MainActivity'
        ]);
    }

    async stopAgentApp() {
        await this.shell('am force-stop com.cicy.agent.alpha');
    }

    async shellInput(args: string) {
        const cmd = `input ${args}`;
        return this.jsonrpcApp('shell', [cmd]);
    }

    async shellInputTap(x: number, y: number) {
        const cmd = `input tab ${x} ${y}`;
        return this.jsonrpcApp('shell', [cmd]);
    }

    async shellInputText(text: string) {
        const cmd = `input text ${text}`;
        return this.jsonrpcApp('shell', [cmd]);
    }

    async shellInputPress(key: string) {
        const cmd = `input press ${key}`;
        return this.jsonrpcApp('shell', [cmd]);
    }

    async download(url: string, savePath: string) {
        return this.jsonrpcApp('download', [url, savePath]);
    }

    async readFile(path: string) {
        return this.jsonrpcApp('readFile', [path]);
    }

    async writeFile(path: string, content: string) {
        return this.jsonrpcApp('writeFile', [path, content]);
    }

    async jsonrpcApp(method: string, params?: string | any[]) {
        return this._action('jsonrpc', {
            method,
            params: typeof params === 'string' ? [params] : params || []
        });
    }

    async jsonrpc(method: string, params?: any[]) {
        return this.jsonrpcApp(method, params);
    }

    async getScreen() {
        let { imgData, imgLen, xml: hierarchy } = await this.jsonrpcApp('screenWithXml');
        if (imgLen === 0) {
            imgData = '';
        }
        return { imgData, hierarchy };
    }

    async getDeviceInfo(): Promise<DeviceInfo> {
        const deviceInfo = await this.jsonrpc('deviceInfo');
        this.deviceInfo = deviceInfo;
        return deviceInfo;
    }

    async getAgentAppInfo(): Promise<DeviceInfo> {
        const agentAppInfo = await this.jsonrpcApp('agentAppInfo');
        this._agentAppInfo = agentAppInfo;
        return agentAppInfo;
    }

    async isOnline() {
        const res = await super.isOnline(this.clientId);
        return !!res;
    }

    async isAppOnline() {
        const res = await super.isOnline(this.clientId + '-APP');
        return !!res;
    }

    async getCurrentPackage() {
        const res = this.shell(
            'dumpsys activity activities | grep -E "mResumedActivity|mCurrentFocus"'
        );
    }
}
