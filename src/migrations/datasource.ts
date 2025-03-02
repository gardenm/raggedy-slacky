import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import { User } from '../entities/user.entity';
import { SlackUser } from '../entities/slack-user.entity';
import { Channel } from '../entities/channel.entity';
import { Message } from '../entities/message.entity';
import { MessageContent } from '../entities/message-content.entity';
import { Attachment } from '../entities/attachment.entity';
import { UserQuery } from '../entities/user-query.entity';
import { Conversation } from '../entities/conversation.entity';
import { ConversationMessage } from '../entities/conversation-message.entity';
import { InitialSchema1740922929178 } from './1740922929178-InitialSchema';

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
  entities: [
    User,
    SlackUser,
    Channel,
    Message,
    MessageContent,
    Attachment,
    UserQuery,
    Conversation,
    ConversationMessage
  ],
  migrations: [InitialSchema1740922929178],
  migrationsTableName: 'migrations',
});