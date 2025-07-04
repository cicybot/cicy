import { RowDataPacket } from "mysql2";
import { BaseConnectionConfig, QueryResult } from "./drivers/IDatabase";
import { MysqlDriver } from "./drivers/MysqlDriver";


type Driver = MysqlDriver;
type DbDriverType = 'mysql' | 'postgres';

export default class Database {
  private static instance: Database;
  private static dbDriver: DbDriverType = "mysql";
  private static masterConfig: BaseConnectionConfig;
  private static slaveDrivers: BaseConnectionConfig[];
  private masterDriver!: Driver;
  private slaveDrivers: Driver[] = [];

  private constructor() {
    if(!Database.masterConfig || !Database.slaveDrivers){
        throw new Error("no masterConfig or slaveDrivers!")
    }
    switch(Database.dbDriver){
        case "mysql":{
            this.masterDriver = new MysqlDriver(Database.masterConfig) 
            this.slaveDrivers = Database.slaveDrivers.map(config => 
                new MysqlDriver(config)
              );
            break;
        }
        default:
            throw new Error("invalid db driver!")
    }
  }
  static initialize(dbDriver:DbDriverType,masterConfig:BaseConnectionConfig,slaveDrivers?:BaseConnectionConfig[]){
    if (Database.instance) {
        throw new Error("Database already initialized");
    }
    Database.dbDriver = dbDriver;
    Database.masterConfig = masterConfig
    Database.slaveDrivers = slaveDrivers ? slaveDrivers: [masterConfig]
  }

  public static getInstance(): Database {
    if (!Database.instance) {
      Database.instance = new Database();
    }
    return Database.instance;
  }

  // 获取主库连接（写操作）
  public async exec(sql: string, params?: any[]): Promise<number> {
    return this.masterDriver.exec(sql, params);
  }

  public async queryFromMaster<R extends QueryResult = RowDataPacket[]>(sql: string, params?: any[]): Promise<R> {
    return this.masterDriver.query<R>(sql, params);
  }
  // 随机选择从库（读操作）
  public async query<R extends QueryResult = RowDataPacket[]>(sql: string, params?: any[]): Promise<R> {
    const driver = this.getRandomSlave();
    return driver.query<R>(sql, params);
  }

  // 事务必须使用主库
  public async beginTransaction() {
    return this.masterDriver.beginTransaction();
  }

  private getRandomSlave(): Driver {
    if (this.slaveDrivers.length === 0) {
      throw new Error('No available slave databases');
    }
    const index = Math.floor(Math.random() * this.slaveDrivers.length);
    return this.slaveDrivers[index];
  }
  private healthCheck() {
    setInterval(async () => {
      await this.masterDriver.query('SELECT 1');
      this.slaveDrivers.forEach(async (d, i) => {
        try {
          await d.query('SELECT 1');
        } catch (err) {
          console.error(`Slave ${i} failed health check`);
          this.slaveDrivers.splice(i, 1);
        }
      });
    }, 60_000);
  }
}

