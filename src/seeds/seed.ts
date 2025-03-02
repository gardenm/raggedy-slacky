import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User, SlackUser, Channel } from '../entities';
import { AppDataSource } from '../migrations/datasource';

async function seed() {
  console.log('Starting database seed...');

  try {
    // Initialize the data source
    const dataSource: DataSource = await AppDataSource.initialize();
    console.log('Database connection established');

    // Seed admin user
    const adminUser = await seedAdminUser(dataSource);
    console.log(`Admin user created: ${adminUser.username}`);

    // Seed regular user
    const regularUser = await seedRegularUser(dataSource);
    console.log(`Regular user created: ${regularUser.username}`);

    // Seed sample Slack data (optional for development)
    await seedSampleSlackData(dataSource);
    console.log('Sample Slack data created');

    // Close the connection
    await dataSource.destroy();
    console.log('Database connection closed');
    console.log('Seed completed successfully');
  } catch (error) {
    console.error('Error during seeding:', error);
    process.exit(1);
  }
}

async function seedAdminUser(dataSource: DataSource) {
  const userRepository = dataSource.getRepository(User);
  
  // Check if admin already exists
  const existingAdmin = await userRepository.findOne({ where: { username: 'admin' } });
  if (existingAdmin) {
    console.log('Admin user already exists, skipping creation');
    return existingAdmin;
  }
  
  // Create admin user
  const passwordHash = await bcrypt.hash('admin123', 10);
  
  const admin = userRepository.create({
    username: 'admin',
    email: 'admin@example.com',
    passwordHash,
    isAdmin: true,
    createdAt: new Date(),
  });
  
  return await userRepository.save(admin);
}

async function seedRegularUser(dataSource: DataSource) {
  const userRepository = dataSource.getRepository(User);
  
  // Check if regular user already exists
  const existingUser = await userRepository.findOne({ where: { username: 'user' } });
  if (existingUser) {
    console.log('Regular user already exists, skipping creation');
    return existingUser;
  }
  
  // Create regular user
  const passwordHash = await bcrypt.hash('password123', 10);
  
  const user = userRepository.create({
    username: 'user',
    email: 'user@example.com',
    passwordHash,
    isAdmin: false,
    createdAt: new Date(),
  });
  
  return await userRepository.save(user);
}

async function seedSampleSlackData(dataSource: DataSource) {
  const slackUserRepository = dataSource.getRepository(SlackUser);
  const channelRepository = dataSource.getRepository(Channel);
  
  // Check if sample data already exists
  const existingUsers = await slackUserRepository.count();
  if (existingUsers > 0) {
    console.log('Sample data already exists, skipping creation');
    return;
  }
  
  // Create sample Slack users
  const slackUsers = slackUserRepository.create([
    {
      slackUserId: 'U01ABC123',
      username: 'johndoe',
      realName: 'John Doe',
      avatar: 'https://example.com/avatar1.jpg',
      isBot: false,
    },
    {
      slackUserId: 'U02DEF456',
      username: 'janedoe',
      realName: 'Jane Doe',
      avatar: 'https://example.com/avatar2.jpg',
      isBot: false,
    },
    {
      slackUserId: 'B03GHI789',
      username: 'slackbot',
      realName: 'Slackbot',
      avatar: 'https://example.com/slackbot.jpg',
      isBot: true,
    },
  ]);
  
  await slackUserRepository.save(slackUsers);
  
  // Create sample Slack channels
  const channels = channelRepository.create([
    {
      slackChannelId: 'C01GENERAL',
      name: 'general',
      purpose: 'General discussion',
      isPrivate: false,
      isArchived: false,
      createdAt: new Date(),
    },
    {
      slackChannelId: 'C02RANDOM',
      name: 'random',
      purpose: 'Random stuff',
      isPrivate: false,
      isArchived: false,
      createdAt: new Date(),
    },
    {
      slackChannelId: 'C03PROJECT',
      name: 'project-x',
      purpose: 'Private project discussion',
      isPrivate: true,
      isArchived: false,
      createdAt: new Date(),
    },
  ]);
  
  await channelRepository.save(channels);
}

// Execute the seed function
seed()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('Unhandled error during seeding:', error);
    process.exit(1);
  });