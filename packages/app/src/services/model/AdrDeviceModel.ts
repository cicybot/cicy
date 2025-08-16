import DatabaseService from '../common/DatabaseService';

export interface AdrDeviceInfo {
    vpnAppInstalled: string;
    vpnAppRunning: string;
    width: number;
    height: number;
    id: number;
    brand: string;
    size: string;
    model: string;
    abilist: string;
    userRotation: string;
    ports: number[];
    abi: string;
    releaseVersion: string;
    sdkVersion: string;
    sn: string;
    serialno: string;
    deviceId: string;
    accessIp?: string;
    accessPort?: string;
    netIps: string[];
}

export interface AdrDeviceTableInfo {
    id?: number;
    deviceId: string;
    updated_at: number;
    info: AdrDeviceInfo;
}

export class AdrDeviceModel {
    deviceId: string;

    constructor(deviceId: string) {
        this.deviceId = deviceId;
    }

    static getForwardPortById(id: number) {
        return 10000 + id;
    }

    static async getAll(): Promise<AdrDeviceTableInfo[]> {
        const res = await new DatabaseService().all(
            `select *
             from adr_device
             order by id desc`,
            []
        );
        return res.map(row => {
            return {
                ...row,
                info: JSON.parse(row.info)
            };
        });
    }

    static async initDb() {
        // localStorage.removeItem('adr_device_inited');
        if (!localStorage.getItem('adr_device_inited')) {
            // await new DatabaseService().exec(`DROP TABLE IF EXISTS adr_device;`);
            await new DatabaseService().exec(`
                CREATE TABLE IF NOT EXISTS adr_device
                (
                    id
                    INTEGER
                    PRIMARY
                    KEY,
                    deviceId
                    TEXT,
                    info
                    TEXT,
                    updated_at
                    INTEGER
                    NOT
                    NULL
                    DEFAULT (
                    strftime
                (
                    '%s',
                    'now'
                ))
                    );
            `);
            localStorage.setItem('adr_device_inited', 'true');
        }
    }

    async get(): Promise<AdrDeviceTableInfo> {
        const res = await new DatabaseService().get(
            `select *
             from adr_device
             where deviceId = ?`,
            [this.deviceId]
        );
        return !res
            ? null
            : {
                  ...res,
                  info: JSON.parse(res.info)
              };
    }

    async save(info: AdrDeviceInfo) {
        const row = await this.get();
        if (row) {
            return await new DatabaseService().run(
                `UPDATE adr_device
                 set info = ?
                 WHERE id = ?`,
                [JSON.stringify(info), row.id]
            );
        } else {
            throw new Error('no AdrDevice');
        }
    }

    async add(info: AdrDeviceInfo) {
        let id = null;
        const res = await new DatabaseService().run(
            `INSERT INTO adr_device (deviceId, info)
             VALUES (?, ?)`,
            [this.deviceId, JSON.stringify(info)]
        );
        if (res) {
            const { lastInsertRowid } = res;
            id = lastInsertRowid;
        }
        return id;
    }

    async updatePort(port: number) {
        const row = await this.get();
        if (row) {
            return await new DatabaseService().run(
                `UPDATE adr_device
                 set id = ?
                 WHERE id = ?`,
                [port - 10000, row.id]
            );
        } else {
            throw new Error('没有找到记录');
        }
    }
}
