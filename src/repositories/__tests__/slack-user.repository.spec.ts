import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { SlackUser } from '../../entities/slack-user.entity';
import { SlackUserRepository } from '../slack-user.repository';
import { createMockRepository, createSampleData } from './test-utils';

describe('SlackUserRepository', () => {
  let repository: SlackUserRepository;
  let mockRepository: any;
  const sampleData = createSampleData();

  beforeEach(async () => {
    mockRepository = createMockRepository<SlackUser>();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SlackUserRepository,
        {
          provide: getRepositoryToken(SlackUser),
          useValue: mockRepository,
        },
      ],
    }).compile();

    repository = module.get<SlackUserRepository>(SlackUserRepository);
  });

  it('should be defined', () => {
    expect(repository).toBeDefined();
  });

  describe('findBySlackUserId', () => {
    it('should find a slack user by slack user ID', async () => {
      const slackUser = sampleData.slackUsers[0];
      mockRepository.findOne.mockResolvedValue(slackUser);

      const result = await repository.findBySlackUserId('U12345');
      
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { slackUserId: 'U12345' },
      });
      expect(result).toEqual(slackUser);
    });

    it('should return null if slack user is not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      const result = await repository.findBySlackUserId('nonexistent');
      
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { slackUserId: 'nonexistent' },
      });
      expect(result).toBeNull();
    });
  });

  describe('findByUsername', () => {
    it('should find a slack user by username', async () => {
      const slackUser = sampleData.slackUsers[0];
      mockRepository.findOne.mockResolvedValue(slackUser);

      const result = await repository.findByUsername('johndoe');
      
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { username: 'johndoe' },
      });
      expect(result).toEqual(slackUser);
    });
  });

  describe('findBots', () => {
    it('should find all bot users', async () => {
      const botUsers = [sampleData.slackUsers[2]];
      mockRepository.find.mockResolvedValue(botUsers);

      const result = await repository.findBots();
      
      expect(mockRepository.find).toHaveBeenCalledWith({
        where: { isBot: true },
      });
      expect(result).toEqual(botUsers);
    });
  });

  describe('findHumans', () => {
    it('should find all human users', async () => {
      const humanUsers = [sampleData.slackUsers[0], sampleData.slackUsers[1]];
      mockRepository.find.mockResolvedValue(humanUsers);

      const result = await repository.findHumans();
      
      expect(mockRepository.find).toHaveBeenCalledWith({
        where: { isBot: false },
      });
      expect(result).toEqual(humanUsers);
    });
  });

  describe('findByIdWithMessages', () => {
    it('should find a slack user with their messages', async () => {
      const slackUser = {
        ...sampleData.slackUsers[0],
        messages: [sampleData.messages[0], sampleData.messages[2]],
      };
      mockRepository.findOne.mockResolvedValue(slackUser);

      const result = await repository.findByIdWithMessages(1);
      
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
        relations: ['messages'],
      });
      expect(result).toEqual(slackUser);
    });
  });

  describe('findOrCreate', () => {
    it('should return existing slack user if found', async () => {
      const slackUser = sampleData.slackUsers[0];
      mockRepository.findOne.mockResolvedValue(slackUser);
      mockRepository.save.mockResolvedValue({ ...slackUser, username: 'updated_johndoe' });

      const result = await repository.findOrCreate({
        slackUserId: 'U12345',
        username: 'updated_johndoe',
      });
      
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { slackUserId: 'U12345' },
      });
      expect(result.username).toEqual('updated_johndoe');
    });

    it('should create a new slack user if not found', async () => {
      const newSlackUser = {
        slackUserId: 'U99999',
        username: 'newuser',
        realName: 'New User',
        isBot: false,
      };
      const createdUser = { id: 4, ...newSlackUser };
      
      mockRepository.findOne.mockResolvedValue(null);
      mockRepository.create.mockReturnValue(createdUser);
      mockRepository.save.mockResolvedValue(createdUser);

      const result = await repository.findOrCreate(newSlackUser);
      
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { slackUserId: 'U99999' },
      });
      expect(mockRepository.create).toHaveBeenCalledWith(newSlackUser);
      expect(result).toEqual(createdUser);
    });

    it('should throw an error if slackUserId is not provided', async () => {
      await expect(repository.findOrCreate({ username: 'test' })).rejects.toThrow(
        'Slack User ID is required',
      );
    });
  });
});