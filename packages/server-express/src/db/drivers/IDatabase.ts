import { ResultSetHeader, RowDataPacket } from 'mysql2/promise';

// 数据库驱动类型
export type DatabaseDriver = 'mysql' | 'postgres';

export type QueryResult<T = any> = T extends RowDataPacket ? T[] : ResultSetHeader;

// 事务操作接口
export interface Transaction {
  commit(): Promise<void>;
  rollback(): Promise<void>;
  query<R extends QueryResult = RowDataPacket[]>(sql: string, params?: any[]): Promise<R>;
}

// 通用连接配置（基础配置）
export interface BaseConnectionConfig {
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
}

// MySQL 扩展配置
export interface MysqlConnectionConfig extends BaseConnectionConfig {
  timezone?: string;
  connectionLimit?: number;
}

// PostgreSQL 扩展配置
export interface PostgresConnectionConfig extends BaseConnectionConfig {
  ssl?: boolean;
  max?: number;
}

// 抽象数据库接口
export abstract class IDatabase<T extends BaseConnectionConfig = BaseConnectionConfig> {
  protected config: T;
  protected connected: boolean = false;

  constructor(config: T) {
    this.config = config;
  }

  // 必须实现的方法
  public abstract connect(): Promise<void>;
  public abstract query<R extends QueryResult = RowDataPacket[]>(
    sql: string,
    params?: any[]
  ): Promise<R>;  
  public abstract exec(sql: string, params?: any[]): Promise<number>;
  public abstract beginTransaction(): Promise<Transaction>;
  public abstract close(): Promise<void>;
}