import { RedisConfig, RedisPool } from './RedisPool';

export default class RedisCache {
  private static instance: RedisCache;

  private constructor() {}

  /**
   * 获取单例实例
   */
  public static getInstance(): RedisCache {
    if (!RedisCache.instance) {
      RedisCache.instance = new RedisCache();
    }
    return RedisCache.instance;
  }

  // 初始化连接池
  static initialize(config?: RedisConfig): void {
    RedisPool.initialize(config)
  }
  /**
   * 设置键值对
   * @param key 键
   * @param value 值
   * @param ttl 过期时间（秒，可选）
   */
  public async set(key: string, value: any, ttl?: number): Promise<void> {
    const client = await RedisPool.getClient();
    const valueJson = JSON.stringify([value])
    try {
      if (ttl) {
        await client.set(key, valueJson, { EX: ttl });
      } else {
        await client.set(key, valueJson);
      }
    } finally {
      await RedisPool.releaseClient(client);
    }
  }

  /**
   * 获取键的值
   * @param key 键
   */
  public async get(key: string): Promise<string | any| null> {
    const client = await RedisPool.getClient();
    try {
      const val = await client.get(key);
      if(val && val.startsWith("[")){
        return JSON.parse(val)[0]
      }else{
        return val
      }
    } finally {
      await RedisPool.releaseClient(client);
    }
  }

  /**
   * 删除键
   * @param key 键
   */
  public async del(key: string): Promise<number> {
    const client = await RedisPool.getClient();
    try {
      return await client.del(key);
    } finally {
      await RedisPool.releaseClient(client);
    }
  }

  /**
   * 检查键是否存在
   * @param key 键
   */
  public async exists(key: string): Promise<boolean> {
    const client = await RedisPool.getClient();
    try {
      const count = await client.exists(key);
      return count === 1;
    } finally {
      await RedisPool.releaseClient(client);
    }
  }
}