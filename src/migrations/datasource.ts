import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import * as entities from '../entities';

// Load environment variables from .env file
config();

// Create and export a TypeORM DataSource instance
export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_DATABASE || 'raggedy-slacky',
  synchronize: false,
  logging: process.env.DB_LOGGING === 'true',
  entities: Object.values(entities),
  migrations: ['src/migrations/*.ts'],
  migrationsTableName: 'migrations',
});