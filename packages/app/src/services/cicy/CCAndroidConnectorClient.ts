import CCBaseAgentClient from './CCBaseAgentClient';
import { DeviceInfo } from './CCWSAgentClient';
import { v4 as uuid } from 'uuid';

export interface AdbDevice {
    sn: string;
    type: string;
    model: string;
    usb: string;
    product: string;
    device: string;
    transport_id: number;
}

export default class CCAndroidConnectorClient extends CCBaseAgentClient {
    sn?: string;
    private device: AdbDevice | undefined;

    constructor() {
        super();
    }

    static formatDeviceInfo(deviceInfo: string) {
        const ports = [];
        const netIfNames = [];
        const netIps = [];
        const lines = deviceInfo.split('\n');
        const info: any = {};

        for (const linesKey in lines) {
            const line = lines[linesKey].trim();
            if (line.indexOf('LISTEN') > -1) {
                ports.push(parseInt(line.split('[::]:')[1].split(' ')[0]));
            } else if (line.indexOf('Link ') > -1) {
                netIfNames.push(line.split(' ')[0]);
            } else if (line.indexOf('inet ') > -1) {
                netIps.push(line.split('inet addr:')[1].split(' ')[0]);
            } else {
                const t = line.split(':');
                const key = t[0].replace('Physical ', '').trim();
                info[key] = line.replace(t[0] + ':', '').trim();
                if (key === 'size') {
                    info['width'] = parseInt(info[key].split('x')[0]);
                    info['height'] = parseInt(info[key].split('x')[1]);
                }
            }
        }
        info['sdkVersion'] = parseInt(info['sdkVersion']);
        info['releaseVersion'] = parseInt(info['releaseVersion']);
        info['density'] = parseInt(info['density']);
        info['ports'] = ports;
        info['netIps'] = netIps;
        info['netIfNames'] = netIfNames;
        info['ts'] = Date.now();
        return info;
    }

    setSn(sn: string) {
        this.sn = sn;
    }

    async adb(cmd: string, useDevice?: boolean) {
        if (useDevice) {
            if (!this.sn) {
                throw new Error('no sn for adb device');
            }
            return await this.shellExec(`adb -s ${this.sn} ${cmd}`);
        } else {
            return await this.shellExec(`adb  ${cmd}`);
        }
    }

    async shellExec(cmd: string) {
        return await this._apiShell('exec', `${cmd}`);
    }

    async deviceAdb(cmd: string) {
        return await this.adb(`${cmd}`, true);
    }

    async deviceAdbShell(cmd: string) {
        return await this.deviceAdb(`shell ${cmd}`);
    }

    async getDeviceProps(props: string) {
        return this.deviceAdbShell('getprop ' + props);
    }

    async deviceScreenShot(deviceInfo: DeviceInfo) {
        try {
            await this.deviceAdbShell('screencap /data/local/tmp/screen.png');
            const res = await this.deviceAdbShell('base64 -i /data/local/tmp/screen.png');
            return `data:image/png;base64,${res}`;
        } catch (e) {
            console.error(e);
            return '';
        }
    }

    async getDeviceCpuAbi() {
        return this.getDeviceProps('ro.product.cpu.abi');
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
                                ...{ sn: row }
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
        return devices.map((row: AdbDevice) => {
            return {
                ...row,
                transport_id: Number(row.transport_id)
            };
        });
    }

    async fileWrite(file: string, content: string) {
        return await this._apiFile('write', [file, content]);
    }

    async fileRead(file: string) {
        return await this._apiFile('read', [file]);
    }

    async deviceAdbForward(localPort: number, remotePort: number) {
        return await this.deviceAdb(`forward tcp:${localPort} tcp:${remotePort}`);
    }

    async getForwardList() {
        const res = await this.adb(`forward --list`);
        if (!res) {
            return [];
        }
        return res.split('\n').map((row: string) => {
            const t = row.split(' tcp:');
            return {
                sn: t[0],
                localPort: parseInt(t[1]),
                remotePort: parseInt(t[2])
            };
        });
    }

    async getForwardPorts() {
        const list = await this.getForwardList();
        const res: number[] = [];
        list.forEach((row: { localPort: any }) => {
            res.push(row.localPort);
        });
        return res;
    }

    async saveDeviceSh() {
        await this.fileWrite(
            'device.sh',
            `
if [ "$1" = "deviceInfo" ]
then

echo deviceId:$(touch /data/local/tmp/id && cat /data/local/tmp/id)
echo userRotation:$(wm user-rotation)
echo brand:$(getprop ro.product.brand)
echo serialno:$(getprop ro.serialno)
echo model:$(getprop ro.product.model)
echo abi:$(getprop ro.product.cpu.abi)
echo abilist:$(getprop ro.product.cpu.abilist)
echo releaseVersion:$(getprop ro.build.version.release)
echo sdkVersion:$(getprop ro.build.version.sdk)
echo $(wm size)
echo $(wm density)
echo tun:$(ifconfig | grep 'tun')
echo isRoot:$(ls /system/bin/su 2>/dev/null)
echo vpnAppInstalled:$(pm list packages | grep com.cicy.agent.alpha)
echo vpnAppRunning:$(pidof com.cicy.agent.alpha)
netstat -tnlp | grep LISTEN | grep app_process
ifconfig | grep "Link "
ifconfig | grep "inet "
fi`
        );
    }

    async handleDeviceInfo() {
        await this.saveDeviceSh();
        await this.deviceAdbPush('device.sh', '/data/local/tmp');
        return this.getDeviceInfo();
    }

    async getDeviceInfo() {
        const deviceInfo = await this.deviceAdbShell('sh /data/local/tmp/device.sh deviceInfo');
        const info = CCAndroidConnectorClient.formatDeviceInfo(deviceInfo);
        if (!info.deviceId) {
            info.deviceId = uuid();
            await this.deviceAdbShell(`echo ${info.deviceId} > /data/local/tmp/id`);
        }
        return info;
    }

    async pmUninstall(packageName: string) {
        return await this.deviceAdbShell(`pm uninstall --user 0 ${packageName}`);
    }

    async pmInstall(apkPath: string) {
        return await this.deviceAdbShell(`pm install -r ${apkPath}`);
    }

    async amStart(packageName: string, activityName: string) {
        return await this.deviceAdbShell(`am start -n ${packageName}/${activityName}`);
    }
    async amStop(packageName: string) {
        return await this.deviceAdbShell(`am force-stop ${packageName}`);
    }
}
