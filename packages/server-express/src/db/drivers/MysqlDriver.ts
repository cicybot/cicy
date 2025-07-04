// src/db/drivers/MysqlDriver.ts
import mysql, { Pool, QueryResult, ResultSetHeader, RowDataPacket } from 'mysql2/promise';
import { IDatabase, MysqlConnectionConfig, Transaction } from './IDatabase';

export class MysqlDriver extends IDatabase<MysqlConnectionConfig> {
  private pool: Pool;

  constructor(config: MysqlConnectionConfig) {
    super(config);
    
    // 初始化主库连接池
    this.pool = mysql.createPool({
      host: config.host,
      port: config.port,
      user: config.user,
      password: config.password,
      database: config.database,
      timezone: config.timezone || 'Z', // 默认 UTC 时区
      connectionLimit: config.connectionLimit || 5,
      waitForConnections: true
    });
  }

  // 连接池初始化（实际无需显式调用）
  async connect(): Promise<void> {
    // MySQL 连接池自动管理连接
    this.connected = true;
  }
  async query<R extends QueryResult = RowDataPacket[]>(
    sql: string,
    params?: any[]
  ): Promise<R> {
    const [result] = await this.pool.query<RowDataPacket[] | ResultSetHeader>(sql, params);
    
    // 类型断言（已知读操作返回 RowDataPacket[]）
    return result as R;
  }

  // 写操作（使用主库）
  async exec(sql: string, params?: any[]): Promise<number> {
    const [result] = await this.pool.query<ResultSetHeader>(sql, params);
    return result.affectedRows;
  }

  // 开启事务（强制使用主库）
  async beginTransaction(): Promise<Transaction> {
    const conn = await this.pool.getConnection();
    await conn.beginTransaction();

    return {
      commit: async () => {
        try {
          await conn.commit();
        } finally {
          conn.release(); // 释放连接到池
        }
      },
      rollback: async () => {
        try {
          await conn.rollback();
        } finally {
          conn.release();
        }
      },
      query: async <R extends QueryResult = RowDataPacket[]>(sql: string, params?: any[]) => {
        const [rows] = await conn.query<RowDataPacket[]>(sql, params);
        return rows as R;
      }
    };
  }

  // 关闭所有连接池
  async close(): Promise<void> {
    await this.pool.end();
    this.connected = false;
  }
}