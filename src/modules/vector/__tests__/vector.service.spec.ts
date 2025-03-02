import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { VectorService } from '../vector.service';

// Mock chromadb
jest.mock('chromadb', () => {
  const mockCollection = {
    add: jest.fn().mockResolvedValue(undefined),
    update: jest.fn().mockResolvedValue(undefined),
    delete: jest.fn().mockResolvedValue(undefined),
    query: jest.fn().mockResolvedValue({
      ids: [['doc1', 'doc2']],
      documents: [['content1', 'content2']],
      metadatas: [[{ source: 'slack' }, { source: 'slack' }]],
      distances: [[0.1, 0.2]],
    }),
    count: jest.fn().mockResolvedValue(10),
  };

  return {
    ChromaClient: jest.fn().mockImplementation(() => ({
      getOrCreateCollection: jest.fn().mockResolvedValue(mockCollection),
      getCollection: jest.fn().mockResolvedValue(mockCollection),
      listCollections: jest.fn().mockResolvedValue([{ name: 'messages' }]),
    })),
  };
});

describe('VectorService', () => {
  let service: VectorService;
  let configService: ConfigService;

  const mockConfigService = {
    get: jest.fn((key, defaultValue) => {
      if (key === 'chroma.host') return 'localhost';
      if (key === 'chroma.port') return 8000;
      return defaultValue;
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VectorService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<VectorService>(VectorService);
    configService = module.get<ConfigService>(ConfigService);
    
    // Initialize service
    await service.onModuleInit();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should initialize with correct configuration', () => {
    expect(configService.get).toHaveBeenCalledWith('chroma.host', 'localhost');
    expect(configService.get).toHaveBeenCalledWith('chroma.port', 8000);
  });

  describe('addEmbeddings', () => {
    it('should add embeddings to a collection', async () => {
      const items = {
        ids: ['1', '2'],
        embeddings: [[0.1, 0.2], [0.3, 0.4]],
        documents: ['doc1', 'doc2'],
        metadatas: [{ source: 'slack' }, { source: 'slack' }],
      };

      await service.addEmbeddings('messages', items);

      const collection = await service.getCollection('messages');
      expect(collection.add).toHaveBeenCalledWith(items);
    });
  });

  describe('updateEmbeddings', () => {
    it('should update embeddings in a collection', async () => {
      const items = {
        ids: ['1', '2'],
        embeddings: [[0.1, 0.2], [0.3, 0.4]],
        documents: ['updated1', 'updated2'],
      };

      await service.updateEmbeddings('messages', items);

      const collection = await service.getCollection('messages');
      expect(collection.update).toHaveBeenCalledWith(items);
    });
  });

  describe('deleteEmbeddings', () => {
    it('should delete embeddings from a collection', async () => {
      const ids = ['1', '2'];

      await service.deleteEmbeddings('messages', ids);

      const collection = await service.getCollection('messages');
      expect(collection.delete).toHaveBeenCalledWith({ ids });
    });
  });

  describe('search', () => {
    it('should search with text query', async () => {
      const results = await service.search({
        queryText: 'test query',
        limit: 5,
      });

      const collection = await service.getCollection('messages');
      expect(collection.query).toHaveBeenCalledWith({
        queryTexts: ['test query'],
        nResults: 5,
        include: ['documents', 'metadatas'],
      });

      expect(results.results.length).toBe(2);
      expect(results.results[0].id).toBe('doc1');
      expect(results.results[0].content).toBe('content1');
      expect(results.results[0].score).toBeCloseTo(0.9);
    });

    it('should search with embedding', async () => {
      const embedding = [0.1, 0.2, 0.3];
      
      const results = await service.search({
        queryEmbedding: embedding,
        limit: 5,
      });

      const collection = await service.getCollection('messages');
      expect(collection.query).toHaveBeenCalledWith({
        queryEmbeddings: [embedding],
        nResults: 5,
        include: ['documents', 'metadatas'],
      });
    });

    it('should apply filters', async () => {
      const results = await service.search({
        queryText: 'test query',
        filters: { channelId: 'C123' },
      });

      const collection = await service.getCollection('messages');
      expect(collection.query).toHaveBeenCalledWith({
        queryTexts: ['test query'],
        nResults: 10,
        include: ['documents', 'metadatas'],
        where: { channelId: 'C123' },
      });
    });

    it('should throw error if no query is provided', async () => {
      await expect(service.search({})).rejects.toThrow(
        'Either queryText or queryEmbedding must be provided'
      );
    });
  });

  describe('getCount', () => {
    it('should return the count of items in a collection', async () => {
      const count = await service.getCount('messages');
      
      const collection = await service.getCollection('messages');
      expect(collection.count).toHaveBeenCalled();
      expect(count).toBe(10);
    });
  });

  describe('healthCheck', () => {
    it('should return true when the database is healthy', async () => {
      const isHealthy = await service.healthCheck();
      expect(isHealthy).toBe(true);
    });

    it('should return false when the health check fails', async () => {
      const mockChromaClient = require('chromadb').ChromaClient.mock.results[0].value;
      mockChromaClient.listCollections.mockRejectedValueOnce(new Error('Connection error'));
      
      const isHealthy = await service.healthCheck();
      expect(isHealthy).toBe(false);
    });
  });
});