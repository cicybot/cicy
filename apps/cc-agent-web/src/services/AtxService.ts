import { arrayBufferToDataUri, getAndroidAppApi, isAndroid } from '../utils/utils';

export class AtxService {
    api: string;

    constructor() {
        this.api = isAndroid() ? 'http://127.0.0.1:4444' : 'http://192.168.63.144:4444';
    }

    async u2Rpc(method: string, params?: any[]) {
        const response = await fetch(`${this.api}/jsonrpc/0`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                jsonrpc: '2.0',
                id: 1,
                method: method,
                params: params || []
            })
        });
        return response.json();
    }

    async handleMessage(ws: WebSocket, data: string) {
        const { action, payload, id } = JSON.parse(data) as any;
        let res;
        try {
            switch (action) {
                case 'deviceInfo': {
                    const response = await this.u2Rpc('deviceInfo');
                    res = {
                        err: '',
                        res: response
                    };
                    break;
                }
                case 'click': {
                    const response = await this.u2Rpc('click', [payload.x || 0, payload.y || 0]);

                    // getAndroidAppApi().post_control_event(
                    //     JSON.stringify({
                    //         eventType: 'click',
                    //         x: payload.x||0,
                    //         y: payload.y||0
                    //     })
                    // );
                    res = {
                        err: '',
                        res: response
                    };
                    break;
                }
                case 'packages': {
                    const response = await fetch(`${this.api}/packages`);
                    res = {
                        err: '',
                        ...(await response.json())
                    };
                    break;
                }
                case 'packagesInfo': {
                    const response = await fetch(
                        `${this.api}/packages/${payload.packageName}/info`
                    );
                    res = {
                        err: '',
                        ...(await response.json())
                    };
                    break;
                }

                case 'screenshot': {
                    const { widthHierarchy } = payload || {};
                    const response = await this.u2Rpc('takeScreenshot', [1, 80]);
                    const imgData = 'data:image/jpeg;base64,' + response['result'];
                    let hierarchy = '';
                    if (widthHierarchy) {
                        // hierarchy = getAndroidAppApi().get_dump()
                        const response = await this.u2Rpc('dumpWindowHierarchy', [false, 50]);
                        hierarchy = response['result'];
                    }
                    res = {
                        err: '',
                        res: {
                            result: {
                                hierarchy,
                                imgData,
                                imgLen: imgData.length
                            }
                        }
                    };
                    break;
                }

                case 'packagesIcon': {
                    const response = await fetch(
                        `${this.api}/packages/${payload.packageName}/icon`
                    );
                    const img = await response.arrayBuffer();
                    const dataUri = await arrayBufferToDataUri(img, 'image/png');

                    res = {
                        err: '',
                        imgData: dataUri
                    };
                    break;
                }

                case 'startApp': {
                    const response = await fetch(`${this.api}/session/${payload.packageName}`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/x-www-form-urlencoded'
                        },
                        body: new URLSearchParams({
                            timeout: payload.timeout || 10,
                            flags: payload.flags || '-S'
                        })
                    });
                    res = {
                        err: '',
                        ...(await response.json())
                    };
                    break;
                }
                case 'stopApp': {
                    res = {
                        err: '',
                        ...(await this.shell(`am force-stop ${payload.packageName}`))
                    };
                    break;
                }
                case 'dumpHierarchy': {
                    res = {
                        err: '',
                        ...(await this.dumpHierarchy())
                    };
                    break;
                }

                case 'uiautomator': {
                    const method = payload!.method as string;
                    const r = await this.uiautomator(method);
                    res = {
                        err: '',
                        res: r
                    };
                    break;
                }

                case 'shell': {
                    const cmd = payload!.cmd as string;
                    const r = await this.shell(cmd);
                    res = {
                        err: '',
                        res: r
                    };
                    break;
                }
                default:
                    break;
            }
        } catch (e) {
            console.error(e);
            //@ts-ignore
            res = { err: e.message };
        }
        if (id && res) {
            ws.send(
                JSON.stringify({
                    id,
                    action: 'callRes',
                    payload: res
                })
            );
        }
    }

    async version() {
        const res = await fetch(`${this.api}/version`);
        return res.text();
    }

    async info() {
        const res = await fetch(`${this.api}/info`);
        return res.json();
    }

    async dumpHierarchy() {
        return {
            result: getAndroidAppApi().get_dump()
        };
    }

    async install(apkUrl: string) {
        const res = await fetch(`${this.api}/install`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: `url=${encodeURIComponent(apkUrl)}`
        });
        return res.json();
    }

    async installStatus(id: string) {
        const res = await fetch(`${this.api}/install/${id}`);
        return res.json();
    }

    async shell(cmd: string) {
        const res = await fetch(`${this.api}/shell`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                cmd
            })
        });
        return res.json();
    }

    async shellBackground(command: string) {
        const res = await fetch(`${this.api}/shell/background`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: `command=${encodeURIComponent(command)}`
        });
        return res.json();
    }

    async webviews() {
        const res = await fetch(`${this.api}/webviews`);
        return res.json();
    }

    async procList() {
        const res = await fetch(`${this.api}/proc/list`);
        return res.json();
    }

    async meminfo(packageName: string) {
        const res = await fetch(`${this.api}/proc/${packageName}/meminfo`);
        return res.json();
    }

    async meminfoAll(packageName: string) {
        const res = await fetch(`${this.api}/proc/${packageName}/meminfo/all`);
        return res.json();
    }

    async cpuinfo(packageNameOrPid: string) {
        const res = await fetch(`${this.api}/proc/${packageNameOrPid}/cpuinfo`);
        return res.json();
    }

    async uiautomator(method: string) {
        const res = await fetch(`${this.api}/uiautomator`, { method });
        if (method.toLowerCase() === 'get') {
            return res.json();
        }
        return res.text();
    }
}
