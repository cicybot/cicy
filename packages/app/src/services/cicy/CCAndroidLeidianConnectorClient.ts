import CCBaseAgentClient from './CCBaseAgentClient';

const LEIDIAN_DIR = `D:\\leidian\\LDPlayer9`;
const LEIDIAN_CONSOLE = `${LEIDIAN_DIR}\\ldconsole.exe`;
const LEIDIAN_CONFIG_PATH = `${LEIDIAN_DIR}\\vms\\config`;

export interface VmInfo {
    index: number;
    name: string;
    adb: number;
    windows_id: number;
    bind_windows_id: number;
    is_running: boolean;
    pid: number;
    vm_pid: number;
    width: number;
    height: number;
    dpi: number;
}

export default class CCAndroidLeidianConnectorClient extends CCBaseAgentClient {
    index?: number;

    constructor() {
        super();
    }

    setIndex(index: number) {
        this.index = index;
    }

    getLeidainDir() {
        return LEIDIAN_DIR;
    }

    getConsolePath() {
        return LEIDIAN_CONSOLE;
    }

    async console(cmd: string) {
        return await this._apiShell('exec', `${this.getConsolePath()} ${cmd}`);
    }

    async isInstalled() {
        try {
            return await this.console(`-h`);
        } catch (e) {
            console.error(e);
            return false;
        }
    }

    async getConfig() {
        const { index } = this;
        if (index === undefined) {
            throw new Error('index is null');
        }
        const configPath = `${LEIDIAN_CONFIG_PATH}\\leidian${index}.config`;
        console.log('getConfig', configPath);
        try {
            const configContent = await this._apiFile('read', configPath);
            return JSON.parse(configContent);
        } catch (error) {
            console.error(`Error reading config for instance ${index}:`, error);
            throw error;
        }
    }

    async editConfig(key: string, value: any) {
        const config = await this.getConfig();
        config[key] = value;
        await this.saveConfig(JSON.stringify(config, null, 4));
        return this.getConfig();
    }

    async saveConfig(content: string) {
        const { index } = this;
        if (index === undefined) {
            throw new Error('index is null');
        }
        const configPath = `${LEIDIAN_CONFIG_PATH}\\leidian${index}.config`;
        try {
            await this._apiFile('write', [configPath, content]);
            return this.getConfig();
        } catch (error) {
            console.error(`Error saving config for instance ${index}:`, error);
            return { err: (error as Error).message };
        }
    }

    async setRootMode(enable: boolean) {
        const config = await this.getConfig();
        config['basicSettings.rootMode'] = enable;
        await this.saveConfig(JSON.stringify(config, null, 4));
        return this.getConfig();
    }

    async backup(bakupFile: string) {
        //*.ldbk
        return this.consoleIndex(`backup`, `--file ${bakupFile}`);
    }

    async backupApp(packageName: string, fileApk: string) {
        return await this.consoleIndex(
            'backupapp',
            `--packagename ${packageName} --file ${fileApk}`
        );
    }

    async modify(index: number, model = false) {
        let cmd = `modify --index ${index} --resolution 720,1280,320 --imei auto `;
        if (model) {
            const model_list = ['SM-N9760', 'SM-N9700', 'SM-G9750', 'SM-G9730'];
            const randModel = model_list[Math.floor(Math.random() * model_list.length)];
            cmd += `--manufacturer samsung --model  ${randModel}`;
        }
        await this.console(cmd);
        return await this.getConfig();
    }

    async getVmList(): Promise<{ rows: VmInfo[] }> {
        const rows: VmInfo[] = [];
        try {
            // const output1 = await this.console(`list2`);
            const output = `0,100004118316807,1771730,7278636,1,37004,35356,720,1280,320
99999,电脑桌面,0,0,1,0,0,1280,719,0`;
            if (output) {
                for (const item of output.trim().split('\n')) {
                    const itemSplit = item.split(',');
                    const index = parseInt(itemSplit[0]);
                    const name = itemSplit[1];

                    if (index !== 99999) {
                        rows.push({
                            index,
                            name,
                            adb: 5554 + index * 2,
                            windows_id: parseInt(itemSplit[2]),
                            bind_windows_id: parseInt(itemSplit[3]),
                            is_running: itemSplit[4] === '1',
                            pid: parseInt(itemSplit[5]),
                            vm_pid: parseInt(itemSplit[6]),
                            width: parseInt(itemSplit[7]),
                            height: parseInt(itemSplit[8]),
                            dpi: parseInt(itemSplit[9].trim())
                        });
                    }
                }
            }
        } catch (error) {
            console.error('Error getting VM list:', error);
        }
        return { rows };
    }

    async consoleIndex(method: string, cmd?: string) {
        const { index } = this;
        if (index === undefined) {
            throw new Error('index is null');
        }
        return this.console(`${method} --index ${index} ${cmd}`);
    }

    async runningList() {
        return this.console(`runninglist`);
    }

    async quitAll() {
        return this.console(`quitAll`);
    }

    async add(name: string) {
        return this.console(`add --name ${name}`);
    }

    async isRunning() {
        return this.consoleIndex('isrunning');
    }

    async reboot() {
        return this.consoleIndex('reboot');
    }

    async launch() {
        return this.consoleIndex('launch');
    }

    async remove() {
        return this.consoleIndex('remove');
    }

    async quit() {
        return this.consoleIndex('quit');
    }

    async unInstallApp(packageName: string) {
        return this.consoleIndex('uninstallapp', `--packagename ${packageName}`);
    }

    async rename(title: string) {
        return this.consoleIndex('rename', `--title ${title}`);
    }

    async installApp(fileName: string) {
        return this.consoleIndex('installapp', `--filename ${fileName}`);
    }

    async runApp(packagename: string) {
        return this.consoleIndex('runapp', `--packagename ${packagename}`);
    }

    async killApp(packagename: string) {
        return this.consoleIndex('killapp', `--packagename ${packagename}`);
    }

    async adb(cmd: string) {
        return this.consoleIndex('adb', `--command ${cmd}`);
    }

    async adbShell(cmd: string) {
        return this.adb(`${cmd}`);
    }
}
