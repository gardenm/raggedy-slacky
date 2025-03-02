import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Conversation } from '../../entities/conversation.entity';
import { ConversationRepository } from '../conversation.repository';
import { createMockRepository, createSampleData } from './test-utils';

describe('ConversationRepository', () => {
  let repository: ConversationRepository;
  let mockRepository: any;
  const sampleData = createSampleData();

  beforeEach(async () => {
    mockRepository = createMockRepository<Conversation>();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ConversationRepository,
        {
          provide: getRepositoryToken(Conversation),
          useValue: mockRepository,
        },
      ],
    }).compile();

    repository = module.get<ConversationRepository>(ConversationRepository);
  });

  it('should be defined', () => {
    expect(repository).toBeDefined();
  });

  describe('findByUserId', () => {
    it('should find conversations by user ID', async () => {
      const conversations = [sampleData.conversations[0], sampleData.conversations[2]];
      mockRepository.find.mockResolvedValue(conversations);

      const result = await repository.findByUserId(1);
      
      expect(mockRepository.find).toHaveBeenCalledWith({
        where: { userId: 1 },
        order: { updatedAt: 'DESC' },
      });
      expect(result).toEqual(conversations);
    });

    it('should apply additional options when provided', async () => {
      const conversations = [sampleData.conversations[0]];
      mockRepository.find.mockResolvedValue(conversations);

      const result = await repository.findByUserId(1, { take: 1 });
      
      expect(mockRepository.find).toHaveBeenCalledWith({
        where: { userId: 1 },
        order: { updatedAt: 'DESC' },
        take: 1,
      });
      expect(result).toEqual(conversations);
    });
  });

  describe('findActiveByUserId', () => {
    it('should find active conversations by user ID', async () => {
      const activeConversations = [sampleData.conversations[0]];
      mockRepository.find.mockResolvedValue(activeConversations);

      const result = await repository.findActiveByUserId(1);
      
      expect(mockRepository.find).toHaveBeenCalledWith({
        where: { userId: 1, isActive: true },
        order: { updatedAt: 'DESC' },
      });
      expect(result).toEqual(activeConversations);
    });
  });

  describe('findWithMessages', () => {
    it('should find a conversation with its messages', async () => {
      const conversation = {
        ...sampleData.conversations[0],
        messages: [sampleData.conversationMessages[0], sampleData.conversationMessages[1]],
      };
      mockRepository.findOne.mockResolvedValue(conversation);

      const result = await repository.findWithMessages(1);
      
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
        relations: ['messages'],
        order: { messages: { timestamp: 'ASC' } },
      });
      expect(result).toEqual(conversation);
    });
  });

  describe('createConversation', () => {
    it('should create a new conversation', async () => {
      const newConversation = {
        userId: 1,
        title: 'New Conversation',
        isActive: true,
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
      };
      const createdConversation = { id: 4, ...newConversation };
      
      mockRepository.create.mockReturnValue(createdConversation);
      mockRepository.save.mockResolvedValue(createdConversation);

      const result = await repository.createConversation(1, 'New Conversation');
      
      expect(mockRepository.create).toHaveBeenCalledWith({
        userId: 1,
        title: 'New Conversation',
        isActive: true,
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
      });
      expect(result).toEqual(createdConversation);
    });
  });

  describe('updateTitle', () => {
    it('should update the title of a conversation', async () => {
      const conversation = sampleData.conversations[0];
      const updatedConversation = {
        ...conversation,
        title: 'Updated Title',
        updatedAt: expect.any(Date),
      };
      
      mockRepository.findOne.mockResolvedValue(conversation);
      mockRepository.save.mockResolvedValue(updatedConversation);

      const result = await repository.updateTitle(1, 'Updated Title');
      
      expect(mockRepository.findOne).toHaveBeenCalled();
      expect(result.title).toEqual('Updated Title');
      expect(result.updatedAt).toBeDefined();
    });
  });

  describe('markAsInactive', () => {
    it('should mark a conversation as inactive', async () => {
      const conversation = sampleData.conversations[0];
      const inactiveConversation = {
        ...conversation,
        isActive: false,
        updatedAt: expect.any(Date),
      };
      
      mockRepository.findOne.mockResolvedValue(conversation);
      mockRepository.save.mockResolvedValue(inactiveConversation);

      const result = await repository.markAsInactive(1);
      
      expect(mockRepository.findOne).toHaveBeenCalled();
      expect(result.isActive).toBe(false);
      expect(result.updatedAt).toBeDefined();
    });
  });

  describe('updateTimestamp', () => {
    it('should update the last updated timestamp', async () => {
      const conversation = sampleData.conversations[0];
      const now = new Date();
      const updatedConversation = {
        ...conversation,
        updatedAt: now,
      };
      
      mockRepository.findOne.mockResolvedValue(conversation);
      mockRepository.save.mockResolvedValue(updatedConversation);

      const result = await repository.updateTimestamp(1);
      
      expect(mockRepository.findOne).toHaveBeenCalled();
      expect(result.updatedAt).toBeDefined();
    });
  });

  describe('countActiveConversations', () => {
    it('should count active conversations for a user', async () => {
      mockRepository.count.mockResolvedValue(1);

      const result = await repository.countActiveConversations(1);
      
      expect(mockRepository.count).toHaveBeenCalledWith({
        where: { userId: 1, isActive: true },
      });
      expect(result).toBe(1);
    });
  });
});