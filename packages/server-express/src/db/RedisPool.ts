import { createPool, Pool } from 'generic-pool';
import { createClient, RedisClientType } from 'redis';

export interface RedisConfig {
  host: string;
  port: number;
  password?: string;
  db?: number;
  poolMin?: number;
  poolMax?: number;
}

export class RedisPool {
  private static pool: Pool<RedisClientType>;

  // 初始化连接池
  static initialize(config?: RedisConfig): void {
    const {
      host = process.env.REDIS_HOST || '127.0.0.1',
      port = parseInt(process.env.REDIS_PORT || '6379'),
      password = process.env.REDIS_PASSWORD || '',
      db = parseInt(process.env.REDIS_DB || '0'),
      poolMin = parseInt(process.env.REDIS_POOL_MIN || '1'),
      poolMax = parseInt(process.env.REDIS_POOL_MAX || '10')
    } = config || {};

    RedisPool.pool = createPool(
      {
        create: async () => {
          const client = createClient({
            url: `redis://${host}:${port}`,
            password: password,
            database: db
          });

          client.on('error', (err) => {
            console.error('Redis client error:', err);
          });

          await client.connect();
          return client as RedisClientType;
        },
        destroy: async (client) => {
          await client.quit();
        }
      },
      {
        min: poolMin,
        max: poolMax
      }
    );
  }

  // 从连接池获取客户端
  static async getClient(): Promise<RedisClientType> {
    if (!RedisPool.pool) {
      throw new Error('RedisPool not initialized');
    }
    return RedisPool.pool.acquire();
  }

  // 释放客户端到连接池
  static async releaseClient(client: RedisClientType): Promise<void> {
    if (!RedisPool.pool) {
      throw new Error('RedisPool not initialized');
    }
    return RedisPool.pool.release(client);
  }

  // 关闭连接池
  static async shutdown(): Promise<void> {
    if (RedisPool.pool) {
      await RedisPool.pool.drain();
      await RedisPool.pool.clear();
    }
  }
}