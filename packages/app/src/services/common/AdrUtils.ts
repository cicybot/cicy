import { AdrDeviceModel } from '../model/AdrDeviceModel';

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

export class AdrUtils {
    useHttp: boolean;
    apiControlUrl: string | undefined;
    ws: WebSocket | undefined | null;
    isMouseDown: boolean;
    private width: number | undefined;
    private height: number | undefined;
    private scale: number | undefined;

    constructor(useHttp: boolean) {
        this.isMouseDown = false;
        this.useHttp = useHttp;
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

    setApiControlUrl(apiControlUrl: string) {
        this.apiControlUrl = apiControlUrl;
    }

    setWs(ws: WebSocket | null) {
        this.ws = ws;
    }

    controlHttpApi(cmd: string) {
        // @ts-ignore
        const { apiControlUrl } = this;
        return fetch(apiControlUrl!, {
            method: 'apiControlUrl',
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
        const { top, left, width, height } = e.target.getBoundingClientRect();
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
        this.controlApi(
            `${TYPE_INJECT_TOUCH_EVENT}|${ACTION_DOWN}|${POINTER_ID_MOUSE}|${x}|${y}|${width}|${height}|${0xffff}|${BUTTON_PRIMARY}|${BUTTON_PRIMARY}`
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

    mouseup(e: any) {
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
                setTimeout(() => {
                    AdrUtils.connectWs(id, options);
                }, 1000);
            };
        } catch (e) {
            setTimeout(() => {
                AdrUtils.connectWs(id, options);
            }, 1000);
        }
    }

    setSize(param: { width: number; height: number; scale: number }) {
        this.width = param.width;
        this.height = param.height;
        this.scale = param.scale;
    }
    jsonRpc(id: number, method: string, params: any[]) {
        const url = `http://127.0.0.1:${AdrDeviceModel.getForwardPortById(id)}/jsonrpc/0`;
        return fetch(url, {
            method: 'POST',
            body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: method, params: params }),
            headers: {
                'Content-Type': 'application/json'
            }
        }).then(res => {
            return res.json();
        });
    }
    dumpWindowHierarchy(id: number, compressed?: boolean, depth?: number) {
        if (!depth) {
            depth = 100;
        }
        if (!compressed) {
            compressed = false;
        }
        return this.jsonRpc(id, 'dumpWindowHierarchy', [compressed, depth]);
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
    pressKey(id: number, code: string) {
        return this.jsonRpc(id, 'pressKey', [code]);
    }
    static getSettingHeight() {
        return 360;
    }
    static getWindowSize(orgWidth: number, orgHeight: number, scale: number, isWin: boolean) {
        if (orgWidth > orgHeight) {
            const minWidth = orgWidth * scale + 58;
            const width = minWidth;
            const minHeight = (isWin ? 0 : 26) + 36 + orgHeight * scale;
            const height = minHeight + AdrUtils.getSettingHeight();
            debugger;
            return {
                width,
                minWidth,
                height,
                minHeight
            };
        } else {
            const minWidth = orgWidth * scale + 58;
            const width = minWidth + 360;
            const height = (isWin ? 0 : 26) + 24 + orgHeight * scale;
            const minHeight = height;
            return {
                width,
                minWidth,
                height,
                minHeight
            };
        }
    }
}
