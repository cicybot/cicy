import dotenv from 'dotenv';
dotenv.config();

// 获取数据库驱动类型
export const DB_DRIVER = process.env.DB_DRIVER as 'mysql' | 'postgres';

// 主库配置
export const masterConfig = {
  host: process.env.DB_MASTER_HOST!,
  port: parseInt(process.env.DB_MASTER_PORT!),
  user: process.env.DB_MASTER_USER!,
  password: process.env.DB_MASTER_PASSWORD!,
  database: process.env.DB_MASTER_DATABASE!,
};

// 自动发现从库配置
export const slaveConfigs = Object.entries(process.env)
  .filter(([key]) => key.startsWith('DB_SLAVE_') && key.endsWith('_HOST'))
  .map(([key]) => {
    const index = key.split('_')[2]; // 提取 DB_SLAVE_1_HOST 中的 '1'
    return {
      host: process.env[`DB_SLAVE_${index}_HOST`]!,
      port: parseInt(process.env[`DB_SLAVE_${index}_PORT`]!),
      user: process.env[`DB_SLAVE_${index}_USER`]!,
      password: process.env[`DB_SLAVE_${index}_PASSWORD`]!,
      database: process.env[`DB_SLAVE_${index}_DATABASE`]!,
    };
  });