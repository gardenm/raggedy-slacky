import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { UserQuery } from '../../entities/user-query.entity';
import { UserQueryRepository } from '../user-query.repository';
import { createMockRepository, createSampleData } from './test-utils';

describe('UserQueryRepository', () => {
  let repository: UserQueryRepository;
  let mockRepository: any;
  const sampleData = createSampleData();

  beforeEach(async () => {
    mockRepository = createMockRepository<UserQuery>();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserQueryRepository,
        {
          provide: getRepositoryToken(UserQuery),
          useValue: mockRepository,
        },
      ],
    }).compile();

    repository = module.get<UserQueryRepository>(UserQueryRepository);
  });

  it('should be defined', () => {
    expect(repository).toBeDefined();
  });

  describe('findByUserId', () => {
    it('should find queries by user ID', async () => {
      const userQueries = [sampleData.userQueries[0]];
      mockRepository.find.mockResolvedValue(userQueries);

      const result = await repository.findByUserId(1);
      
      expect(mockRepository.find).toHaveBeenCalledWith({
        where: { userId: 1 },
        order: { timestamp: 'DESC' },
      });
      expect(result).toEqual(userQueries);
    });

    it('should apply additional options when provided', async () => {
      const userQueries = [sampleData.userQueries[0]];
      mockRepository.find.mockResolvedValue(userQueries);

      const result = await repository.findByUserId(1, { take: 5 });
      
      expect(mockRepository.find).toHaveBeenCalledWith({
        where: { userId: 1 },
        order: { timestamp: 'DESC' },
        take: 5,
      });
      expect(result).toEqual(userQueries);
    });
  });

  describe('findBySessionId', () => {
    it('should find queries by session ID', async () => {
      const userQueries = [sampleData.userQueries[0]];
      mockRepository.find.mockResolvedValue(userQueries);

      const result = await repository.findBySessionId('session1');
      
      expect(mockRepository.find).toHaveBeenCalledWith({
        where: { sessionId: 'session1' },
        order: { timestamp: 'ASC' },
      });
      expect(result).toEqual(userQueries);
    });
  });

  describe('findConversationalQueries', () => {
    it('should find all conversational queries', async () => {
      const userQueries = [sampleData.userQueries[1]];
      mockRepository.find.mockResolvedValue(userQueries);

      const result = await repository.findConversationalQueries();
      
      expect(mockRepository.find).toHaveBeenCalledWith({
        where: {
          isConversational: true,
        },
        order: { timestamp: 'DESC' },
      });
      expect(result).toEqual(userQueries);
    });

    it('should filter by user ID if provided', async () => {
      const userQueries = [sampleData.userQueries[1]];
      mockRepository.find.mockResolvedValue(userQueries);

      const result = await repository.findConversationalQueries(2);
      
      expect(mockRepository.find).toHaveBeenCalledWith({
        where: {
          isConversational: true,
          userId: 2,
        },
        order: { timestamp: 'DESC' },
      });
      expect(result).toEqual(userQueries);
    });
  });

  describe('findSimilarQueries', () => {
    it('should find similar queries', async () => {
      const userQueries = [sampleData.userQueries[0]];
      const queryBuilder = {
        orWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(userQueries),
      };
      
      mockRepository.createQueryBuilder.mockReturnValue(queryBuilder);

      const result = await repository.findSimilarQueries('search project documents');
      
      expect(mockRepository.createQueryBuilder).toHaveBeenCalledWith('uq');
      // There are 3 words longer than 3 chars: 'search', 'project', 'documents'
      expect(queryBuilder.orWhere).toHaveBeenCalledTimes(3);
      expect(queryBuilder.orderBy).toHaveBeenCalledWith('uq.timestamp', 'DESC');
      expect(queryBuilder.limit).toHaveBeenCalledWith(5);
      expect(result).toEqual(userQueries);
    });

    it('should handle short words and empty queries', async () => {
      const result = await repository.findSimilarQueries('a b c');
      
      expect(mockRepository.createQueryBuilder).not.toHaveBeenCalled();
      expect(result).toEqual([]);
    });
  });

  describe('findQueriesWithResults', () => {
    it('should find queries with results', async () => {
      const userQueries = [sampleData.userQueries[0], sampleData.userQueries[1]];
      const queryBuilder = {
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(userQueries)
      };
      mockRepository.createQueryBuilder.mockReturnValue(queryBuilder);

      const result = await repository.findQueriesWithResults();
      
      expect(mockRepository.createQueryBuilder).toHaveBeenCalledWith('uq');
      expect(queryBuilder.where).toHaveBeenCalledWith('uq.results IS NOT NULL');
      expect(queryBuilder.orderBy).toHaveBeenCalledWith('uq.timestamp', 'DESC');
      expect(result).toEqual(userQueries);
    });

    it('should filter by user ID if provided', async () => {
      const userQueries = [sampleData.userQueries[0]];
      const queryBuilder = {
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(userQueries)
      };
      mockRepository.createQueryBuilder.mockReturnValue(queryBuilder);

      const result = await repository.findQueriesWithResults(1);
      
      expect(mockRepository.createQueryBuilder).toHaveBeenCalledWith('uq');
      expect(queryBuilder.where).toHaveBeenCalledWith('uq.results IS NOT NULL');
      expect(queryBuilder.andWhere).toHaveBeenCalledWith('uq.user_id = :userId', { userId: 1 });
      expect(queryBuilder.orderBy).toHaveBeenCalledWith('uq.timestamp', 'DESC');
      expect(result).toEqual(userQueries);
    });
  });

  describe('findRecentQueries', () => {
    it('should find recent queries', async () => {
      const userQueries = [sampleData.userQueries[1], sampleData.userQueries[0]];
      mockRepository.find.mockResolvedValue(userQueries);

      const result = await repository.findRecentQueries();
      
      expect(mockRepository.find).toHaveBeenCalledWith({
        where: {},
        order: { timestamp: 'DESC' },
        take: 10,
      });
      expect(result).toEqual(userQueries);
    });

    it('should filter by user ID if provided', async () => {
      const userQueries = [sampleData.userQueries[0]];
      mockRepository.find.mockResolvedValue(userQueries);

      const result = await repository.findRecentQueries(1, 5);
      
      expect(mockRepository.find).toHaveBeenCalledWith({
        where: { userId: 1 },
        order: { timestamp: 'DESC' },
        take: 5,
      });
      expect(result).toEqual(userQueries);
    });
  });

  describe('saveResults', () => {
    it('should save results for a query', async () => {
      const userQuery = sampleData.userQueries[0];
      const results = { count: 10, items: ['result1', 'result2'] };
      const updatedQuery = { ...userQuery, results };
      
      mockRepository.findOne.mockResolvedValue(userQuery);
      mockRepository.save.mockResolvedValue(updatedQuery);

      const result = await repository.saveResults(1, results);
      
      expect(mockRepository.findOne).toHaveBeenCalled();
      expect(result.results).toEqual(results);
    });
  });

  describe('createQueryInSession', () => {
    it('should create a new query in a session', async () => {
      const newQuery = {
        userId: 1,
        query: 'new query',
        sessionId: 'session3',
        isConversational: true,
        timestamp: expect.any(Date),
      };
      const createdQuery = { id: 3, ...newQuery };
      
      mockRepository.create.mockReturnValue(createdQuery);
      mockRepository.save.mockResolvedValue(createdQuery);

      const result = await repository.createQueryInSession(1, 'new query', 'session3', true);
      
      expect(mockRepository.create).toHaveBeenCalledWith({
        userId: 1,
        query: 'new query',
        sessionId: 'session3',
        isConversational: true,
        timestamp: expect.any(Date),
      });
      expect(result).toEqual(createdQuery);
    });

    it('should default to non-conversational if not specified', async () => {
      const newQuery = {
        userId: 1,
        query: 'new query',
        sessionId: 'session3',
        isConversational: false,
        timestamp: expect.any(Date),
      };
      const createdQuery = { id: 3, ...newQuery };
      
      mockRepository.create.mockReturnValue(createdQuery);
      mockRepository.save.mockResolvedValue(createdQuery);

      const result = await repository.createQueryInSession(1, 'new query', 'session3');
      
      expect(mockRepository.create).toHaveBeenCalledWith({
        userId: 1,
        query: 'new query',
        sessionId: 'session3',
        isConversational: false,
        timestamp: expect.any(Date),
      });
      expect(result).toEqual(createdQuery);
    });
  });
});