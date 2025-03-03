// Import all entities directly to avoid circular dependencies
import { User } from './user.entity';
import { SlackUser } from './slack-user.entity';
import { Channel } from './channel.entity';
import { Message } from './message.entity';
import { UserQuery } from './user-query.entity';
import { MessageContent } from './message-content.entity';
import { Attachment } from './attachment.entity';
import { Conversation } from './conversation.entity';
import { ConversationMessage } from './conversation-message.entity';

// Export entities individually
export { 
  User, 
  SlackUser, 
  Channel, 
  Message, 
  UserQuery, 
  MessageContent, 
  Attachment, 
  Conversation, 
  ConversationMessage 
};