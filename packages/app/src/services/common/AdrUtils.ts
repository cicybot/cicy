import { AdrDeviceInfo, AdrDeviceModel } from '../model/AdrDeviceModel';
import { BinaryDataReader } from './BinaryDataReader';
import CCAndroidConnectorClient from '../cicy/CCAndroidConnectorClient';
import axios from 'axios';

export const ACTION_DOWN = 0;
export const ACTION_UP = 1;
export const ACTION_MOVE = 2;

export const POINTER_ID_MOUSE = -1;

export const BUTTON_PRIMARY = 1 << 0;
export const BUTTON_SECONDARY = 1 << 1;
export const BUTTON_TERTIARY = 1 << 2;

export const KEYCODE_ENTER = 66;
export const KEYCODE_DEL = 67;
export const KEYCODE_HOME = 3;
export const KEYCODE_BACK = 4;
export const KEYCODE_RECENT_APPS = 312;

export const TYPE_INJECT_KEYCODE = 0;
export const TYPE_INJECT_TEXT = 1;
export const TYPE_INJECT_TOUCH_EVENT = 2;
export const TYPE_INJECT_SCROLL_EVENT = 3;
export const TYPE_BACK_OR_SCREEN_ON = 4;
export const TYPE_EXPAND_NOTIFICATION_PANEL = 5;
export const TYPE_EXPAND_SETTINGS_PANEL = 6;
export const TYPE_COLLAPSE_PANELS = 7;
export const TYPE_GET_CLIPBOARD = 8;
export const TYPE_SET_CLIPBOARD = 9;
export const TYPE_SET_DISPLAY_POWER = 10;
export const TYPE_ROTATE_DEVICE = 11;
export const TYPE_UHID_CREATE = 12;
export const TYPE_UHID_INPUT = 13;
export const TYPE_UHID_DESTROY = 14;
export const TYPE_OPEN_HARD_KEYBOARD_SETTINGS = 15;
export const TYPE_START_APP = 16;
export const TYPE_RESET_VIDEO = 17;
export type AccessControlMode = 'AcceptAll' | 'AcceptSelected' | 'DenySelected';
export class AdrUtils {
    useHttp: boolean;
    ws: WebSocket | undefined | null;
    isMouseDown: boolean;
    accessIp?: string;
    accessPort?: string;
    id?: number;
    releaseUrl: string[];
    lastTs: number;
    inited: boolean;
    isFocus: boolean;
    private width: number | undefined;
    private height: number | undefined;
    private scale: number | undefined;
    private screenInfo: any;

    constructor(useHttp: boolean) {
        this.isMouseDown = false;
        this.useHttp = useHttp;
        this.isFocus = false;
        this.releaseUrl = [];
        this.lastTs = Date.now() / 1000;
        this.inited = false;
    }

    static connectWs(
        id: number,
        options?: {
            onOpen?: (ws: WebSocket) => void;
            onClose?: () => void;
            onMessage?: (msg: string | Blob) => void;
        }
    ) {
        const port = AdrDeviceModel.getForwardPortById(id);
        try {
            const ws = new WebSocket(`ws://localhost:${port}/ws-api`);
            ws.onopen = () => {
                console.log('ws onopen');
                options?.onOpen && options?.onOpen(ws);
            };
            ws.onmessage = async e => {
                options?.onMessage && options?.onMessage(e.data);

                if (e.data instanceof Blob) {
                    const text = await e.data.text(); // Read the Blob as text
                    try {
                        const jsonData = JSON.parse(text);
                        console.log('Parsed data:', jsonData);
                        if (jsonData.action === 'resetConnection') {
                            // debugger;
                            // ws.close(3001, 'close');
                        }
                    } catch (err) {
                        console.error('Error parsing JSON:', err);
                    }
                } else {
                    // Handle non-Blob data (text)
                    console.log(e.data.toString());
                }
            };
            ws.onclose = e => {
                options?.onClose && options?.onClose();
                if (e.code !== 3001) {
                    setTimeout(() => {
                        AdrUtils.connectWs(id, options);
                    }, 1000);
                } else {
                    debugger;
                }
            };
        } catch (e) {
            setTimeout(() => {
                AdrUtils.connectWs(id, options);
            }, 1000);
        }
    }

    static getSettingHeight() {
        return 360;
    }

    static getBottomHeight() {
        return 32;
    }

    static getWindowSize(orgWidth: number, orgHeight: number, isWin: boolean) {
        let scale = 0.5;
        const tabBarHeight = isWin ? 0 : 26;
        //todo fix window tabBar height
        let minHeight = tabBarHeight + AdrUtils.getBottomHeight() * 2 + orgHeight * scale;
        const { availHeight } = window.screen;
        if (minHeight > availHeight) {
            scale = scale * 0.9;
            minHeight = tabBarHeight + AdrUtils.getBottomHeight() * 2 + orgHeight * scale;
        }
        const height = minHeight;
        const minWidth = orgWidth * scale;
        const width = minWidth;
        return {
            width,
            minWidth,
            height,
            minHeight
        };
    }

    static handleScreenImage(value: Uint8Array, onScreenImageUpdate: (imageUrl: string) => void) {
        const reader = new BinaryDataReader(value);
        const len = reader.readInt();
        if (len <= 0 || len > value.byteLength) {
            return;
        }
        const jpegData = reader.readBytes(len);
        const blob = new Blob([jpegData], { type: 'image/jpeg' });
        const imageUrl = URL.createObjectURL(blob);
        onScreenImageUpdate(imageUrl);
        const width = reader.readInt();
        const height = reader.readInt();
        const quality = reader.readInt();
        const scale = reader.readInt() / 100; // Convert back from percentage
        const seconds = reader.readInt();
        const millis = reader.readInt();
        const ts = Date.now() / 1000;
        const ts0 = seconds + millis / 1000;
        const delay = Math.floor(ts - ts0);

        return {
            width,
            height,
            quality,
            scale,
            len,
            seconds,
            millis,
            ts0,
            ts,
            delay: delay < 0 ? 0 : delay
        };
    }

    setIsFocus(isFocus: boolean) {
        this.isFocus = isFocus;
    }

    controlWsApi(cmd: string) {
        const { ws } = this;
        if (ws && ws.readyState === WebSocket.OPEN) {
            console.debug(cmd);
            ws.send(cmd);
            return true;
        } else {
            console.log('readyState', ws?.readyState);
            return false;
        }
    }

    setWs(ws: WebSocket | null) {
        this.ws = ws;
    }

    controlHttpApi(cmd: string) {
        return fetch(`${this.getBaseUrl()}/controller`, {
            method: 'POST',
            body: cmd
        });
    }

    controlApi(cmd: string) {
        if (this.useHttp) {
            return this.controlHttpApi(cmd);
        } else {
            return this.controlWsApi(cmd);
        }
    }

    injectEvent(type: number) {
        switch (type) {
            case TYPE_INJECT_TEXT:
                return this.controlApi(`${type}|test`);

            case TYPE_BACK_OR_SCREEN_ON:
                return this.controlApi(`${type}|${ACTION_UP}`);
            case TYPE_EXPAND_NOTIFICATION_PANEL:
            case TYPE_EXPAND_SETTINGS_PANEL:
            case TYPE_COLLAPSE_PANELS:
            case TYPE_ROTATE_DEVICE:
            case TYPE_OPEN_HARD_KEYBOARD_SETTINGS:
            case TYPE_RESET_VIDEO:
                return this.controlApi(`${type}|`);
            case TYPE_SET_DISPLAY_POWER:
                return this.controlApi(`${type}|1`);
        }
    }

    getPosition(e: any) {
        const { pageX, pageY } = e;
        const { top, left, width } = e.target.getBoundingClientRect();
        const x = pageX - left;
        const y = pageY - top;
        const { width: screenWidth, height: screenHeight } = this;
        const scale = width / screenWidth!;
        return {
            x: Math.round(x / scale),
            y: Math.round(y / scale),
            width: screenWidth,
            height: screenHeight
        };
    }

    mousedown(e: any) {
        this.isMouseDown = true;
        const { x, y, width, height } = this.getPosition(e);
        return this._mousedown({ x, y, width, height });
    }

    mouseup(e: any) {
        this.isMouseDown = false;
        const { x, y, width, height } = this.getPosition(e);
        return this._mouseup({ x, y, width, height });
    }
    async _mousedown({
        x,
        y,
        width,
        height
    }: {
        x: number;
        y: number;
        width?: number;
        height?: number;
    }) {
        return this.controlApi(
            `${TYPE_INJECT_TOUCH_EVENT}|${ACTION_DOWN}|${POINTER_ID_MOUSE}|${x}|${y}|${width}|${height}|${0xffff}|${BUTTON_PRIMARY}|${BUTTON_PRIMARY}`
        );
    }
    async _mouseup({
        x,
        y,
        width,
        height
    }: {
        x: number;
        y: number;
        width?: number;
        height?: number;
    }) {
        return this.controlApi(
            `${TYPE_INJECT_TOUCH_EVENT}|${ACTION_UP}|${POINTER_ID_MOUSE}|${x}|${y}|${width}|${height}|${0xffff}|${BUTTON_PRIMARY}|${BUTTON_PRIMARY}`
        );
    }

    mousemove(e: any) {
        if (this.isMouseDown) {
            const { x, y, width, height } = this.getPosition(e);
            this.controlApi(
                `${TYPE_INJECT_TOUCH_EVENT}|${ACTION_MOVE}|${POINTER_ID_MOUSE}|${x}|${y}|${width}|${height}|${0xffff}|${BUTTON_PRIMARY}|${BUTTON_PRIMARY}`
            );
        }
    }

    mouseleave(e: any) {
        this.isMouseDown = false;
        const { x, y, width, height } = this.getPosition(e);
        this.controlApi(
            `${TYPE_INJECT_TOUCH_EVENT}|${ACTION_UP}|${POINTER_ID_MOUSE}|${x}|${y}|${width}|${height}|${0xffff}|${BUTTON_PRIMARY}|${BUTTON_PRIMARY}`
        );
    }

    async injectKeyCode(keyCode: any, isUp: boolean, repeat = 1) {
        await this.controlApi(
            `${TYPE_INJECT_KEYCODE}|${isUp ? ACTION_UP : ACTION_DOWN}|${keyCode}|${repeat}|${0x0}`
        );
    }

    async keyPress(keyCode: number) {
        await this.injectKeyCode(keyCode, false);
        await this.injectKeyCode(keyCode, true);
    }

    async handleKey(e: any, isUp: boolean) {
        const { keycode, key } = e;
        // console.log(keycode,e)
        if (key.length === 1) {
            if (!isUp) {
                return this.controlApi(`${TYPE_INJECT_TEXT}|${key}`);
            }
            return;
        } else if (key === 'Enter') {
            await this.injectKeyCode(KEYCODE_ENTER, isUp);
        } else if (key === 'Backspace') {
            await this.injectKeyCode(KEYCODE_DEL, isUp);
        } else if (key === 'Escape') {
            await this.injectKeyCode(KEYCODE_BACK, isUp);
        }
    }

    setSize(param: { width: number; height: number; scale: number }) {
        this.width = param.width;
        this.height = param.height;
        this.scale = param.scale;
    }

    async jsonRpc(method: string, params: any[]) {
        const url = `${this.getBaseUrl()}/jsonrpc/0`;
        return await fetch(url, {
            method: 'POST',
            body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: method, params: params }),
            headers: {
                'Content-Type': 'application/json'
            }
        }).then(res => {
            return res.json();
        });
    }

    dumpWindowHierarchy(compressed?: boolean, depth?: number) {
        if (!depth) {
            depth = 100;
        }
        if (!compressed) {
            compressed = false;
        }
        return this.jsonRpc('dumpWindowHierarchy', [compressed, depth]);
    }

    /**
     *
     * @param code
     *
     *  press key via name or key code. Supported key name includes:
     *             home, back, left, right, up, down, center, menu, search, enter,
     *             delete(or del), recent(recent apps), volume_up, volume_down,
     *             volume_mute, camera, power.
     */
    pressKey(code: string) {
        return this.jsonRpc('pressKey', [code]);
    }

    async rotate() {
        return await this.injectEvent(TYPE_ROTATE_DEVICE);
    }
    getBaseUrl(id?: number) {
        if (this.accessIp) {
            return `http://${this.accessIp}:${this.accessPort || '9010'}`;
        }
        return `http://127.0.0.1:${AdrDeviceModel.getForwardPortById(id || this.id!)}`;
    }
    getSwagger() {
        return `http://127.0.0.1:${localStorage.getItem(
            'serverPort'
        )}/static/assets/doc.html?id=agent&access=${encodeURIComponent(this.getBaseUrl())}`;
    }
    setId(id: number) {
        this.id = id;
        return this;
    }

    setAccessIp(ip?: string) {
        if (ip) {
            this.accessIp = ip;
        }

        return this;
    }

    setAccessPort(port?: string) {
        if (port) {
            this.accessPort = port;
        }
        return this;
    }

    async getClashConfigYaml() {
        try {
            const res = await axios.get(`${this.getBaseUrl()}/clash/clashConfig.yaml`, {
                timeout: 5000
            });
            return res.data;
        } catch (e) {
            return null;
        }
    }
    async clashIsClashRunning() {
        return await this.clashJsonRpc('isClashRunning');
    }

    async clashStart() {
        return await this.clashJsonRpc('startClash');
    }

    async clashStop() {
        return await this.clashJsonRpc('stopClash');
    }

    async clashUpdate() {
        return await this.clashJsonRpc('updateClash');
    }

    async clashEditClashProxyConfig(
        ip: string,
        port: string,
        user: string,
        password: string,
        accessControlMode: AccessControlMode,
        accessControlPackages: string[]
    ) {
        return await this.clashJsonRpc('editClashProxyConfig', [
            ip,
            port,
            user,
            password,
            accessControlMode,
            accessControlPackages
        ]);
    }

    async clashSetClashAutoRestart(auth: boolean) {
        return await this.clashJsonRpc('setClashAutoRestart', [auth]);
    }

    async clashSetAccessControlMode(mode: AccessControlMode) {
        return await this.clashJsonRpc('setAccessControlMode', [mode]);
    }

    async clashSetAccessControlPackages(apps: string[]) {
        return await this.clashJsonRpc('setAccessControlPackages', [apps]);
    }

    async clashGetClashConfig() {
        const res = await this.clashJsonRpc('getClashConfig');
        if (res) {
            const result = res.result;
            return {
                ...result,
                accessControlPackages: JSON.parse(result.accessControlPackages)
            };
        } else {
            return null;
        }
    }

    async clashJsonRpc(method: string, params?: any[]) {
        try {
            const res = await axios.post(
                `${this.getBaseUrl()}/clash/jsonrpc`,
                {
                    method,
                    params: params || []
                },
                {
                    timeout: 5000
                }
            );
            return res.data;
        } catch (e) {
            return null;
        }
    }

    async getVersion() {
        try {
            const res = await fetch(`${this.getBaseUrl()}/version`);
            return await res.text();
        } catch (e) {
            return null;
        }
    }

    async getAppsList() {
        try {
            const res = await fetch(`${this.getBaseUrl()}/apps/list`);
            const text = await res.text();
            if (text) {
                return text
                    .replace('List of apps:', '')
                    .trim()
                    .split('\n')
                    .map(line => {
                        const t = line.trim().split(/\s+/);
                        return {
                            name: t[1],
                            packageName: t[2],
                            type: t[0]
                        };
                    });
            } else {
                return [];
            }
        } catch (e) {
            return [];
        }
    }
    async getDeviceInfo() {
        try {
            const res = await axios.get(`${this.getBaseUrl()}/deviceInfo`, {
                timeout: 1000
            });
            const text = res.data;
            return CCAndroidConnectorClient.formatDeviceInfo(text);
        } catch (e) {
            return null;
        }
    }

    async shellExec(cmd: string) {
        try {
            const res = await fetch(`${this.getBaseUrl()}/shell/exec`, {
                method: 'POST',
                body: cmd
            });
            return await res.text();
        } catch (e) {
            return null;
        }
    }

    async getScreenSize() {
        try {
            const res = await fetch(`${this.getBaseUrl()}/screen/size`);
            const json = await res.json();
            const [width, height] = json.size.split('/');
            return { width: parseInt(width), height: parseInt(height) };
        } catch (e) {
            return null;
        }
    }
    async closeWs() {
        if (this.ws) {
            debugger;
            this.ws.close(3001, 'no reconnect');
        }
    }

    setScreenInfo(screenInfo: any) {
        this.screenInfo = screenInfo;
    }

    getScreenInfo() {
        return this.screenInfo;
    }

    setDevice(device: AdrDeviceInfo) {
        this.setId(device.id).setAccessPort(device.accessPort).setAccessIp(device.accessIp);
        return this;
    }

    async amStart(packageName: string, activityName: string) {
        return await this.shellExec(`am start -n ${packageName}/${activityName}`);
    }

    async amStop(packageName: string) {
        return await this.shellExec(`am force-stop ${packageName}`);
    }
}
