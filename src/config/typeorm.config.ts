import { DataSourceOptions } from 'typeorm';
import { config } from 'dotenv';
import * as entities from '../entities';

// Load environment variables from .env file
config();

// TypeORM configuration for the application
export const typeOrmConfig: DataSourceOptions = {
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_DATABASE || 'raggedy-slacky',
  synchronize: process.env.NODE_ENV === 'development',
  logging: process.env.DB_LOGGING === 'true',
  entities: Object.values(entities),
  migrations: ['dist/migrations/*.js'],
  migrationsTableName: 'migrations',
};