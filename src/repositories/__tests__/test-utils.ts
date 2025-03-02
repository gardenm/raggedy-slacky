import { Repository, ObjectLiteral } from 'typeorm';

/**
 * Creates a mock TypeORM repository with common methods
 * @returns A mock repository object
 */
export function createMockRepository<T extends ObjectLiteral>(): jest.Mocked<Repository<T>> {
  const mockRepo = {
    find: jest.fn(),
    findOne: jest.fn(),
    findOneBy: jest.fn(),
    findOneOrFail: jest.fn(),
    save: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    remove: jest.fn(),
    merge: jest.fn(),
    count: jest.fn(),
    createQueryBuilder: jest.fn(() => ({
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      addOrderBy: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      innerJoinAndSelect: jest.fn().mockReturnThis(),
      getOne: jest.fn(),
      getMany: jest.fn(),
      getManyAndCount: jest.fn(),
      getCount: jest.fn(),
      execute: jest.fn(),
    })),
    metadata: {
      columns: [],
      relations: []
    },
    manager: {}
  };

  return mockRepo as unknown as jest.Mocked<Repository<T>>;
}

/**
 * Creates sample data for testing
 * @returns Sample data for each entity type
 */
export function createSampleData() {
  const users = [
    {
      id: 1,
      username: 'admin',
      email: 'admin@example.com',
      passwordHash: 'hashed_password_1',
      createdAt: new Date('2023-01-01'),
      lastLogin: new Date('2023-01-02'),
      isAdmin: true,
      queries: [],
      conversations: [],
    },
    {
      id: 2,
      username: 'user',
      email: 'user@example.com',
      passwordHash: 'hashed_password_2',
      createdAt: new Date('2023-01-03'),
      lastLogin: new Date('2023-01-04'),
      isAdmin: false,
      queries: [],
      conversations: [],
    },
  ];

  const slackUsers = [
    {
      id: 1,
      slackUserId: 'U12345',
      username: 'johndoe',
      realName: 'John Doe',
      avatar: 'avatar1.jpg',
      isBot: false,
      metadata: { title: 'Software Engineer' },
    },
    {
      id: 2,
      slackUserId: 'U67890',
      username: 'janedoe',
      realName: 'Jane Doe',
      avatar: 'avatar2.jpg',
      isBot: false,
      metadata: { title: 'Product Manager' },
    },
    {
      id: 3,
      slackUserId: 'B12345',
      username: 'slackbot',
      realName: 'Slack Bot',
      avatar: 'slackbot.jpg',
      isBot: true,
      metadata: null,
    },
  ];

  const channels = [
    {
      id: 1,
      slackChannelId: 'C12345',
      name: 'general',
      purpose: 'General discussions',
      isPrivate: false,
      isArchived: false,
      createdAt: new Date('2022-01-01'),
      metadata: { topic: 'Welcome to the channel' },
    },
    {
      id: 2,
      slackChannelId: 'C67890',
      name: 'random',
      purpose: 'Random stuff',
      isPrivate: false,
      isArchived: false,
      createdAt: new Date('2022-01-02'),
      metadata: { topic: 'Random discussions' },
    },
    {
      id: 3,
      slackChannelId: 'C11111',
      name: 'private-channel',
      purpose: 'Private discussions',
      isPrivate: true,
      isArchived: false,
      createdAt: new Date('2022-01-03'),
      metadata: { topic: 'Confidential' },
    },
    {
      id: 4,
      slackChannelId: 'C22222',
      name: 'archived-channel',
      purpose: 'Old discussions',
      isPrivate: false,
      isArchived: true,
      createdAt: new Date('2022-01-04'),
      metadata: { topic: 'Archived' },
    },
  ];

  const messages = [
    {
      id: 1,
      slackMessageId: 'M12345',
      slackUserId: 1,
      channelId: 1,
      timestamp: new Date('2023-01-01T10:00:00Z'),
      threadTs: null,
      hasAttachments: false,
      contentHash: 'hash1',
      reactions: { '+1': 2 },
      metadata: { edited: false },
    },
    {
      id: 2,
      slackMessageId: 'M67890',
      slackUserId: 2,
      channelId: 1,
      timestamp: new Date('2023-01-01T10:15:00Z'),
      threadTs: 'M12345',
      hasAttachments: false,
      contentHash: 'hash2',
      reactions: null,
      metadata: { edited: false },
    },
    {
      id: 3,
      slackMessageId: 'M11111',
      slackUserId: 1,
      channelId: 2,
      timestamp: new Date('2023-01-02T09:00:00Z'),
      threadTs: null,
      hasAttachments: true,
      contentHash: 'hash3',
      reactions: { 'laughing': 3 },
      metadata: { edited: true },
    },
  ];

  const messageContents = [
    {
      id: 1,
      messageId: 1,
      rawContent: 'Hello world!',
      plainContent: 'Hello world!',
      processedContent: 'hello world',
    },
    {
      id: 2,
      messageId: 2,
      rawContent: 'Hello <@U12345>!',
      plainContent: 'Hello @johndoe!',
      processedContent: 'hello johndoe',
    },
    {
      id: 3,
      messageId: 3,
      rawContent: 'Check out this file!',
      plainContent: 'Check out this file!',
      processedContent: 'check out file',
    },
  ];

  const attachments = [
    {
      id: 1,
      messageId: 3,
      slackFileId: 'F12345',
      filename: 'document.pdf',
      filetype: 'pdf',
      filesize: 1024,
      urlPrivate: 'https://slack.com/files/F12345',
      localPath: '/storage/F12345.pdf',
      thumbnailPath: '/storage/F12345_thumb.jpg',
      metadata: { pages: 5 },
    },
  ];

  const userQueries = [
    {
      id: 1,
      userId: 1,
      query: 'search for project docs',
      timestamp: new Date('2023-01-10T14:00:00Z'),
      results: { count: 5 },
      isConversational: false,
      sessionId: 'session1',
    },
    {
      id: 2,
      userId: 2,
      query: 'tell me about the new feature',
      timestamp: new Date('2023-01-10T15:30:00Z'),
      results: { count: 3 },
      isConversational: true,
      sessionId: 'session2',
    },
  ];

  const conversations = [
    {
      id: 1,
      userId: 1,
      title: 'Project Discussion',
      createdAt: new Date('2023-01-15T10:00:00Z'),
      updatedAt: new Date('2023-01-15T10:30:00Z'),
      isActive: true,
    },
    {
      id: 2,
      userId: 2,
      title: 'Feature Planning',
      createdAt: new Date('2023-01-16T11:00:00Z'),
      updatedAt: new Date('2023-01-16T11:45:00Z'),
      isActive: true,
    },
    {
      id: 3,
      userId: 1,
      title: 'Old Conversation',
      createdAt: new Date('2022-12-01T09:00:00Z'),
      updatedAt: new Date('2022-12-01T09:30:00Z'),
      isActive: false,
    },
  ];

  const conversationMessages = [
    {
      id: 1,
      conversationId: 1,
      role: 'user',
      content: 'What\'s the status of the project?',
      timestamp: new Date('2023-01-15T10:00:00Z'),
      referencedMessages: ['M12345'],
      metadata: null,
    },
    {
      id: 2,
      conversationId: 1,
      role: 'assistant',
      content: 'The project is on track. Here\'s the latest update...',
      timestamp: new Date('2023-01-15T10:01:00Z'),
      referencedMessages: ['M67890', 'M11111'],
      metadata: { confidence: 0.95 },
    },
    {
      id: 3,
      conversationId: 2,
      role: 'user',
      content: 'Can you explain the new feature?',
      timestamp: new Date('2023-01-16T11:00:00Z'),
      referencedMessages: null,
      metadata: null,
    },
  ];

  return {
    users,
    slackUsers,
    channels,
    messages,
    messageContents,
    attachments,
    userQueries,
    conversations,
    conversationMessages,
  };
}