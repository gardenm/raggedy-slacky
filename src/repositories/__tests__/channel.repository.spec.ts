import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Channel } from '../../entities/channel.entity';
import { ChannelRepository } from '../channel.repository';
import { createMockRepository, createSampleData } from './test-utils';

describe('ChannelRepository', () => {
  let repository: ChannelRepository;
  let mockRepository: any;
  const sampleData = createSampleData();

  beforeEach(async () => {
    mockRepository = createMockRepository<Channel>();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChannelRepository,
        {
          provide: getRepositoryToken(Channel),
          useValue: mockRepository,
        },
      ],
    }).compile();

    repository = module.get<ChannelRepository>(ChannelRepository);
  });

  it('should be defined', () => {
    expect(repository).toBeDefined();
  });

  describe('findBySlackChannelId', () => {
    it('should find a channel by slack channel ID', async () => {
      const channel = sampleData.channels[0];
      mockRepository.findOne.mockResolvedValue(channel);

      const result = await repository.findBySlackChannelId('C12345');
      
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { slackChannelId: 'C12345' },
      });
      expect(result).toEqual(channel);
    });

    it('should return null if channel is not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      const result = await repository.findBySlackChannelId('nonexistent');
      
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { slackChannelId: 'nonexistent' },
      });
      expect(result).toBeNull();
    });
  });

  describe('findByName', () => {
    it('should find a channel by name', async () => {
      const channel = sampleData.channels[0];
      mockRepository.findOne.mockResolvedValue(channel);

      const result = await repository.findByName('general');
      
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { name: 'general' },
      });
      expect(result).toEqual(channel);
    });
  });

  describe('findPublicChannels', () => {
    it('should find all public channels', async () => {
      const publicChannels = [sampleData.channels[0], sampleData.channels[1], sampleData.channels[3]];
      mockRepository.find.mockResolvedValue(publicChannels);

      const result = await repository.findPublicChannels();
      
      expect(mockRepository.find).toHaveBeenCalledWith({
        where: { isPrivate: false },
      });
      expect(result).toEqual(publicChannels);
    });
  });

  describe('findPrivateChannels', () => {
    it('should find all private channels', async () => {
      const privateChannels = [sampleData.channels[2]];
      mockRepository.find.mockResolvedValue(privateChannels);

      const result = await repository.findPrivateChannels();
      
      expect(mockRepository.find).toHaveBeenCalledWith({
        where: { isPrivate: true },
      });
      expect(result).toEqual(privateChannels);
    });
  });

  describe('findActiveChannels', () => {
    it('should find all active channels', async () => {
      const activeChannels = [sampleData.channels[0], sampleData.channels[1], sampleData.channels[2]];
      mockRepository.find.mockResolvedValue(activeChannels);

      const result = await repository.findActiveChannels();
      
      expect(mockRepository.find).toHaveBeenCalledWith({
        where: { isArchived: false },
      });
      expect(result).toEqual(activeChannels);
    });
  });

  describe('findArchivedChannels', () => {
    it('should find all archived channels', async () => {
      const archivedChannels = [sampleData.channels[3]];
      mockRepository.find.mockResolvedValue(archivedChannels);

      const result = await repository.findArchivedChannels();
      
      expect(mockRepository.find).toHaveBeenCalledWith({
        where: { isArchived: true },
      });
      expect(result).toEqual(archivedChannels);
    });
  });

  describe('findByIdWithMessages', () => {
    it('should find a channel with its messages', async () => {
      const channel = {
        ...sampleData.channels[0],
        messages: [sampleData.messages[0], sampleData.messages[1]],
      };
      mockRepository.findOne.mockResolvedValue(channel);

      const result = await repository.findByIdWithMessages(1);
      
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
        relations: ['messages'],
      });
      expect(result).toEqual(channel);
    });
  });

  describe('findOrCreate', () => {
    it('should return existing channel if found', async () => {
      const channel = sampleData.channels[0];
      mockRepository.findOne.mockResolvedValue(channel);
      mockRepository.save.mockResolvedValue({ ...channel, name: 'updated-general' });

      const result = await repository.findOrCreate({
        slackChannelId: 'C12345',
        name: 'updated-general',
      });
      
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { slackChannelId: 'C12345' },
      });
      expect(result.name).toEqual('updated-general');
    });

    it('should create a new channel if not found', async () => {
      const newChannel = {
        slackChannelId: 'C99999',
        name: 'new-channel',
        purpose: 'New channel purpose',
        isPrivate: false,
        isArchived: false,
      };
      const createdChannel = { id: 5, ...newChannel, createdAt: new Date() };
      
      mockRepository.findOne.mockResolvedValue(null);
      mockRepository.create.mockReturnValue(createdChannel);
      mockRepository.save.mockResolvedValue(createdChannel);

      const result = await repository.findOrCreate(newChannel);
      
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { slackChannelId: 'C99999' },
      });
      expect(mockRepository.create).toHaveBeenCalledWith(newChannel);
      expect(result).toEqual(createdChannel);
    });

    it('should throw an error if slackChannelId is not provided', async () => {
      await expect(repository.findOrCreate({ name: 'test-channel' })).rejects.toThrow(
        'Slack Channel ID is required',
      );
    });
  });
});