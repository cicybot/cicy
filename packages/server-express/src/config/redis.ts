import dotenv from 'dotenv';
dotenv.config();
export const redisConfig = {
  host: process.env.REDIS_HOST!,
  port: parseInt(process.env.REDIS_PORT||"6379"),
  password: process.env.REDIS_PASSWORD!,
  database: process.env.REDIS_DB,
  poolMin: parseInt(process.env.REDIS_POOL_MIN || '1'),
  poolMax: parseInt(process.env.REDIS_POOL_MAX || '10')
};

