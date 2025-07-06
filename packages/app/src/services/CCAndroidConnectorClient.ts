import CCBaseAgentClient from './CCBaseAgentClient';
import { DeviceInfo } from './CCWSAgentClient';
import { arrayBufferToBase64 } from '../utils/utils';

export interface AdbDevice {
    id: string;
    type: string;
    model: string;
    usb: string;
    product: string;
    device: string;
    transport_id: string;
}

export default class CCAndroidConnectorClient extends CCBaseAgentClient {
    transportId?: string;

    constructor() {
        super();
    }
    setTransportId(transportId: string) {
        this.transportId = transportId;
    }

    async adb(cmd: string) {
        return this.shellExec(`adb ${cmd}`);
    }

    async shellExec(cmd: string) {
        return this._apiShell('exec', `${cmd}`);
    }

    async deviceAdb(cmd: string) {
        if (!this.transportId) {
            throw new Error('no transportId');
        }
        return this.adb(`-t ${this.transportId} ${cmd}`);
    }
    async deviceAdbShell(cmd: string) {
        return this.deviceAdb(`shell ${cmd}`);
    }

    async getDevcieProps(props: string) {
        return this.deviceAdbShell('getprop ' + props);
    }

    async deviceScreenShot(deviceInfo: DeviceInfo) {
        const {
            ccAgentRustPid,
            ipAddress,
            ccAgentAppHttpServer,
            ccAgentMediaProjection,
            ccAgentRustHttpServer
        } = deviceInfo;
        try {
            if (ccAgentAppHttpServer && ccAgentMediaProjection) {
                const res = await fetch(`http://${ipAddress}:${ccAgentAppHttpServer}/screen`);
                const { result } = await res.json();
                const { imgData } = result;
                return imgData;
            } else if (ccAgentRustHttpServer) {
                const res = await fetch(`http://${ipAddress}:${ccAgentRustHttpServer}/screen`);
                const arrayBuffer = await res.arrayBuffer();
                return `data:image/png;base64,${await arrayBufferToBase64(arrayBuffer)}`;
            } else {
                await this.deviceAdbShell('screencap /data/local/tmp/screen.png');
                const res = await this.deviceAdbShell('base64 -i /data/local/tmp/screen.png');
                return `data:image/png;base64,${res}`;
            }
        } catch (e) {
            console.error(e);
            return '';
        }
    }

    async getDevcieCpuAbi() {
        return this.getDevcieProps('ro.product.cpu.abi');
    }

    async deviceAdbPush(local: string, remote: string) {
        const res = await this.deviceAdb(`push ${local} ${remote}`);
        if (res.includes('adb: error:')) {
            throw new Error(res);
        } else {
            return res;
        }
    }

    async agentRust(cmd: string) {
        return this.deviceAdbShell(`/data/local/tmp/cicy-agent ${cmd}`);
    }

    async agentRustDeviceInfo() {
        const result = await this.agentRust(`--device-info`);
        return JSON.parse(result);
    }

    async agentRustDownload(url: string, savePath: string) {
        const result = await this.agentRust(`--download-url ${url} --save-path=${savePath}`);
        return result;
    }

    async agentRustStartLoop() {
        return this.agentRust(`-d`);
    }

    async agentRustStop() {
        return this.agentRust(`--stop`);
    }

    async getDeviceList(): Promise<AdbDevice[]> {
        const result = await this.adb('devices -l');
        const devices = result
            .split('\n')
            .filter((row: string) => !!row)
            .filter((row: string) => row.includes('transport_id'))
            .map((row: string) => {
                let device = {};
                row.trim()
                    .split(' ')
                    .filter(row => !!row)
                    .map(row => row.trim())
                    .map((row, index) => {
                        if (index === 0) {
                            device = {
                                ...device,
                                ...{ id: row }
                            };
                        } else if (index === 1) {
                            device = {
                                ...device,
                                ...{ type: row }
                            };
                        } else {
                            const [k, v] = row.split(':');
                            device = {
                                ...device,
                                ...{ [k]: v }
                            };
                        }
                    });

                return device;
            });
        return devices;
    }
}
