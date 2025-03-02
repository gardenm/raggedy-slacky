import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Attachment } from '../../entities/attachment.entity';
import { AttachmentRepository } from '../attachment.repository';
import { createMockRepository, createSampleData } from './test-utils';

describe('AttachmentRepository', () => {
  let repository: AttachmentRepository;
  let mockRepository: any;
  const sampleData = createSampleData();

  beforeEach(async () => {
    mockRepository = createMockRepository<Attachment>();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AttachmentRepository,
        {
          provide: getRepositoryToken(Attachment),
          useValue: mockRepository,
        },
      ],
    }).compile();

    repository = module.get<AttachmentRepository>(AttachmentRepository);
  });

  it('should be defined', () => {
    expect(repository).toBeDefined();
  });

  describe('findByMessageId', () => {
    it('should find attachments by message ID', async () => {
      const attachments = [sampleData.attachments[0]];
      mockRepository.find.mockResolvedValue(attachments);

      const result = await repository.findByMessageId(3);
      
      expect(mockRepository.find).toHaveBeenCalledWith({
        where: { messageId: 3 },
      });
      expect(result).toEqual(attachments);
    });

    it('should return empty array if no attachments found', async () => {
      mockRepository.find.mockResolvedValue([]);

      const result = await repository.findByMessageId(999);
      
      expect(mockRepository.find).toHaveBeenCalledWith({
        where: { messageId: 999 },
      });
      expect(result).toEqual([]);
    });
  });

  describe('findBySlackFileId', () => {
    it('should find attachment by Slack file ID', async () => {
      const attachment = sampleData.attachments[0];
      mockRepository.findOne.mockResolvedValue(attachment);

      const result = await repository.findBySlackFileId('F12345');
      
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { slackFileId: 'F12345' },
      });
      expect(result).toEqual(attachment);
    });

    it('should return null if attachment not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      const result = await repository.findBySlackFileId('nonexistent');
      
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { slackFileId: 'nonexistent' },
      });
      expect(result).toBeNull();
    });
  });

  describe('findByFiletype', () => {
    it('should find attachments by filetype', async () => {
      const attachments = [sampleData.attachments[0]];
      mockRepository.find.mockResolvedValue(attachments);

      const result = await repository.findByFiletype('pdf');
      
      expect(mockRepository.find).toHaveBeenCalledWith({
        where: { filetype: 'pdf' },
      });
      expect(result).toEqual(attachments);
    });

    it('should apply additional options when provided', async () => {
      const attachments = [sampleData.attachments[0]];
      mockRepository.find.mockResolvedValue(attachments);

      const result = await repository.findByFiletype('pdf', { take: 10 });
      
      expect(mockRepository.find).toHaveBeenCalledWith({
        where: { filetype: 'pdf' },
        take: 10,
      });
      expect(result).toEqual(attachments);
    });
  });

  describe('findWithLocalFiles', () => {
    it('should find attachments that have local files', async () => {
      const attachments = [sampleData.attachments[0]];
      const queryBuilder = {
        where: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(attachments)
      };
      mockRepository.createQueryBuilder.mockReturnValue(queryBuilder);

      const result = await repository.findWithLocalFiles();
      
      expect(mockRepository.createQueryBuilder).toHaveBeenCalledWith('attachment');
      expect(queryBuilder.where).toHaveBeenCalledWith('attachment.local_path IS NOT NULL');
      expect(result).toEqual(attachments);
    });
  });

  describe('findByMessageIdWithMessage', () => {
    it('should find attachments by message ID with message data', async () => {
      const attachments = [
        {
          ...sampleData.attachments[0],
          message: sampleData.messages[2],
        },
      ];
      mockRepository.find.mockResolvedValue(attachments);

      const result = await repository.findByMessageIdWithMessage(3);
      
      expect(mockRepository.find).toHaveBeenCalledWith({
        where: { messageId: 3 },
        relations: ['message'],
      });
      expect(result).toEqual(attachments);
    });
  });

  describe('searchByFilename', () => {
    it('should search attachments by filename', async () => {
      const attachments = [sampleData.attachments[0]];
      const queryBuilder = {
        where: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(attachments)
      };
      mockRepository.createQueryBuilder.mockReturnValue(queryBuilder);

      const result = await repository.searchByFilename('document');
      
      expect(mockRepository.createQueryBuilder).toHaveBeenCalledWith('attachment');
      expect(queryBuilder.where).toHaveBeenCalledWith('attachment.filename ILIKE :searchTerm', { searchTerm: '%document%' });
      expect(result).toEqual(attachments);
    });
  });

  describe('updateLocalPath', () => {
    it('should update local path for an attachment', async () => {
      const attachment = sampleData.attachments[0];
      const updatedAttachment = { ...attachment, localPath: '/new/path/file.pdf' };
      
      mockRepository.findOne.mockResolvedValue(attachment);
      mockRepository.save.mockResolvedValue(updatedAttachment);

      const result = await repository.updateLocalPath(1, '/new/path/file.pdf');
      
      expect(mockRepository.findOne).toHaveBeenCalled();
      expect(result.localPath).toEqual('/new/path/file.pdf');
    });
  });

  describe('findOrCreate', () => {
    it('should return existing attachment if found', async () => {
      const attachment = sampleData.attachments[0];
      mockRepository.findOne.mockResolvedValue(attachment);
      mockRepository.save.mockResolvedValue({ ...attachment, filesize: 2048 });

      const result = await repository.findOrCreate({
        slackFileId: 'F12345',
        messageId: 3,
        filesize: 2048,
      });
      
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { slackFileId: 'F12345' },
      });
      expect(result.filesize).toEqual(2048);
    });

    it('should create a new attachment if not found', async () => {
      const newAttachment = {
        slackFileId: 'F99999',
        messageId: 3,
        filename: 'newfile.jpg',
        filetype: 'jpg',
      };
      const createdAttachment = { id: 2, ...newAttachment };
      
      mockRepository.findOne.mockResolvedValue(null);
      mockRepository.create.mockReturnValue(createdAttachment);
      mockRepository.save.mockResolvedValue(createdAttachment);

      const result = await repository.findOrCreate(newAttachment);
      
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { slackFileId: 'F99999' },
      });
      expect(mockRepository.create).toHaveBeenCalledWith(newAttachment);
      expect(result).toEqual(createdAttachment);
    });

    it('should throw an error if required fields are missing', async () => {
      await expect(repository.findOrCreate({ slackFileId: 'F12345' })).rejects.toThrow(
        'Slack File ID and Message ID are required',
      );

      await expect(repository.findOrCreate({ messageId: 3 })).rejects.toThrow(
        'Slack File ID and Message ID are required',
      );
    });
  });
});