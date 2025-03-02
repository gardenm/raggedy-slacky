import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConversationMessage } from '../../entities/conversation-message.entity';
import { ConversationMessageRepository } from '../conversation-message.repository';
import { createMockRepository, createSampleData } from './test-utils';

describe('ConversationMessageRepository', () => {
  let repository: ConversationMessageRepository;
  let mockRepository: any;
  const sampleData = createSampleData();

  beforeEach(async () => {
    mockRepository = createMockRepository<ConversationMessage>();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ConversationMessageRepository,
        {
          provide: getRepositoryToken(ConversationMessage),
          useValue: mockRepository,
        },
      ],
    }).compile();

    repository = module.get<ConversationMessageRepository>(ConversationMessageRepository);
  });

  it('should be defined', () => {
    expect(repository).toBeDefined();
  });

  describe('findByConversationId', () => {
    it('should find messages by conversation ID', async () => {
      const messages = [sampleData.conversationMessages[0], sampleData.conversationMessages[1]];
      mockRepository.find.mockResolvedValue(messages);

      const result = await repository.findByConversationId(1);
      
      expect(mockRepository.find).toHaveBeenCalledWith({
        where: { conversationId: 1 },
        order: { timestamp: 'ASC' },
      });
      expect(result).toEqual(messages);
    });

    it('should apply additional options when provided', async () => {
      const messages = [sampleData.conversationMessages[0], sampleData.conversationMessages[1]];
      mockRepository.find.mockResolvedValue(messages);

      const result = await repository.findByConversationId(1, { take: 5 });
      
      expect(mockRepository.find).toHaveBeenCalledWith({
        where: { conversationId: 1 },
        order: { timestamp: 'ASC' },
        take: 5,
      });
      expect(result).toEqual(messages);
    });
  });

  describe('findByRole', () => {
    it('should find messages by role', async () => {
      const userMessages = [sampleData.conversationMessages[0]];
      mockRepository.find.mockResolvedValue(userMessages);

      const result = await repository.findByRole(1, 'user');
      
      expect(mockRepository.find).toHaveBeenCalledWith({
        where: { conversationId: 1, role: 'user' },
        order: { timestamp: 'ASC' },
      });
      expect(result).toEqual(userMessages);
    });
  });

  describe('findLastMessage', () => {
    it('should find the last message in a conversation', async () => {
      const lastMessage = sampleData.conversationMessages[1];
      mockRepository.find.mockResolvedValue([lastMessage]);

      const result = await repository.findLastMessage(1);
      
      expect(mockRepository.find).toHaveBeenCalledWith({
        where: { conversationId: 1 },
        order: { timestamp: 'DESC' },
        take: 1,
      });
      expect(result).toEqual(lastMessage);
    });

    it('should return null if no messages exist', async () => {
      mockRepository.find.mockResolvedValue([]);

      const result = await repository.findLastMessage(999);
      
      expect(result).toBeNull();
    });
  });

  describe('findWithReferences', () => {
    it('should find messages with references', async () => {
      const messagesWithReferences = [
        sampleData.conversationMessages[0],
        sampleData.conversationMessages[1],
      ];
      const queryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(messagesWithReferences)
      };
      mockRepository.createQueryBuilder.mockReturnValue(queryBuilder);

      const result = await repository.findWithReferences(1);
      
      expect(mockRepository.createQueryBuilder).toHaveBeenCalledWith('cm');
      expect(queryBuilder.where).toHaveBeenCalledWith('cm.conversation_id = :conversationId', { conversationId: 1 });
      expect(queryBuilder.andWhere).toHaveBeenCalledWith('cm.referenced_messages IS NOT NULL');
      expect(queryBuilder.andWhere).toHaveBeenCalledWith('jsonb_array_length(cm.referenced_messages) > 0');
      expect(result).toEqual(messagesWithReferences);
    });
  });

  describe('addMessage', () => {
    it('should add a new message to a conversation', async () => {
      const newMessage = {
        conversationId: 1,
        role: 'user',
        content: 'New message',
        timestamp: expect.any(Date),
        referencedMessages: ['M12345'],
        metadata: { intent: 'question' },
      };
      const createdMessage = { id: 4, ...newMessage };
      
      mockRepository.create.mockReturnValue(createdMessage);
      mockRepository.save.mockResolvedValue(createdMessage);

      const result = await repository.addMessage(
        1,
        'user',
        'New message',
        ['M12345'],
        { intent: 'question' },
      );
      
      expect(mockRepository.create).toHaveBeenCalledWith({
        conversationId: 1,
        role: 'user',
        content: 'New message',
        timestamp: expect.any(Date),
        referencedMessages: ['M12345'],
        metadata: { intent: 'question' },
      });
      expect(result).toEqual(createdMessage);
    });

    it('should handle optional parameters', async () => {
      const newMessage = {
        conversationId: 1,
        role: 'user',
        content: 'New message',
        timestamp: expect.any(Date),
      };
      const createdMessage = { id: 4, ...newMessage };
      
      mockRepository.create.mockReturnValue(createdMessage);
      mockRepository.save.mockResolvedValue(createdMessage);

      const result = await repository.addMessage(1, 'user', 'New message');
      
      expect(mockRepository.create).toHaveBeenCalledWith({
        conversationId: 1,
        role: 'user',
        content: 'New message',
        timestamp: expect.any(Date),
      });
      expect(result).toEqual(createdMessage);
    });
  });

  describe('countMessages', () => {
    it('should count messages in a conversation', async () => {
      mockRepository.count.mockResolvedValue(2);

      const result = await repository.countMessages(1);
      
      expect(mockRepository.count).toHaveBeenCalledWith({
        where: { conversationId: 1 },
      });
      expect(result).toBe(2);
    });
  });

  describe('searchContent', () => {
    it('should search message content', async () => {
      const messages = [sampleData.conversationMessages[0]];
      const queryBuilder = {
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(messages),
      };
      
      mockRepository.createQueryBuilder.mockReturnValue(queryBuilder);

      const result = await repository.searchContent('project');
      
      expect(mockRepository.createQueryBuilder).toHaveBeenCalledWith('cm');
      expect(queryBuilder.where).toHaveBeenCalledWith('cm.content ILIKE :keyword', { keyword: '%project%' });
      expect(queryBuilder.orderBy).toHaveBeenCalledWith('cm.timestamp', 'DESC');
      expect(result).toEqual(messages);
    });
  });
});