import { createConnection } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { config } from 'dotenv';
import * as entities from '../entities';

// Load configuration from environment files
config();
const configService = new ConfigService();

// Define seed data
const users = [
  {
    username: 'admin',
    email: 'admin@example.com',
    passwordHash: '$2b$10$uA1xH1AwHK.oCGKmGXhszeQCJCT4x8RrwvdlQVP3DLJEJ6KXE7vym', // 'password123'
    createdAt: new Date(),
    lastLogin: null,
  },
  {
    username: 'user',
    email: 'user@example.com',
    passwordHash: '$2b$10$uA1xH1AwHK.oCGKmGXhszeQCJCT4x8RrwvdlQVP3DLJEJ6KXE7vym', // 'password123'
    createdAt: new Date(),
    lastLogin: null,
  },
];

// Main seeding function
async function seed() {
  try {
    // Create database connection
    const connection = await createConnection({
      type: 'postgres',
      host: configService.get('DB_HOST', 'localhost'),
      port: parseInt(configService.get('DB_PORT', '5432'), 10),
      username: configService.get('DB_USERNAME', 'postgres'),
      password: configService.get('DB_PASSWORD', 'postgres'),
      database: configService.get('DB_DATABASE', 'raggedy-slacky'),
      entities: Object.values(entities),
      synchronize: false,
    });

    console.log('Connected to database');

    // Seed users
    console.log('Seeding users...');
    const userRepository = connection.getRepository('User');
    
    for (const userData of users) {
      const existingUser = await userRepository.findOne({ where: { username: userData.username } });
      
      if (!existingUser) {
        await userRepository.save(userData);
        console.log(`Created user: ${userData.username}`);
      } else {
        console.log(`User ${userData.username} already exists, skipping`);
      }
    }

    // You can add more seed data for other entities here
    
    console.log('Seeding completed successfully');
    await connection.close();
  } catch (error) {
    console.error('Error during database seeding:', error);
    process.exit(1);
  }
}

// Run the seed function
seed();