import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindManyOptions } from 'typeorm';
import { UserQuery } from '../entities/user-query.entity';
import { BaseRepository } from './base.repository';

@Injectable()
export class UserQueryRepository extends BaseRepository<UserQuery> {
  constructor(
    @InjectRepository(UserQuery)
    private readonly userQueryRepository: Repository<UserQuery>,
  ) {
    super(userQueryRepository);
  }

  /**
   * Find queries by user ID
   * @param userId The user ID
   * @param options Additional find options
   * @returns Array of user queries
   */
  async findByUserId(userId: number, options?: Omit<FindManyOptions<UserQuery>, 'where'>): Promise<UserQuery[]> {
    return this.findAll({
      ...options,
      where: { userId },
      order: { timestamp: 'DESC' },
    });
  }

  /**
   * Find queries by session ID
   * @param sessionId The session ID
   * @param options Additional find options
   * @returns Array of user queries
   */
  async findBySessionId(sessionId: string, options?: Omit<FindManyOptions<UserQuery>, 'where'>): Promise<UserQuery[]> {
    return this.findAll({
      ...options,
      where: { sessionId },
      order: { timestamp: 'ASC' },
    });
  }

  /**
   * Find conversational queries
   * @param userId The user ID (optional)
   * @returns Array of conversational queries
   */
  async findConversationalQueries(userId?: number): Promise<UserQuery[]> {
    return this.findAll({
      where: {
        isConversational: true,
        ...(userId && { userId }),
      },
      order: { timestamp: 'DESC' },
    });
  }

  /**
   * Find similar queries
   * @param query The query text to find similar queries for
   * @param limit The maximum number of queries to return
   * @returns Array of similar queries
   */
  async findSimilarQueries(query: string, limit: number = 5): Promise<UserQuery[]> {
    // This is a simple implementation that searches for queries containing words from the input query
    // A more sophisticated implementation might use word embeddings or a full-text search index
    const words = query.toLowerCase().split(/\s+/).filter(word => word.length > 3);
    
    if (words.length === 0) {
      return [];
    }
    
    const queryBuilder = this.userQueryRepository.createQueryBuilder('uq');
    
    for (const word of words) {
      queryBuilder.orWhere('LOWER(uq.query) LIKE :word', { word: `%${word}%` });
    }
    
    return queryBuilder
      .orderBy('uq.timestamp', 'DESC')
      .limit(limit)
      .getMany();
  }

  /**
   * Find queries with results
   * @param userId The user ID (optional)
   * @returns Array of queries with results
   */
  async findQueriesWithResults(userId?: number): Promise<UserQuery[]> {
    const queryBuilder = this.getRepository()
      .createQueryBuilder('uq')
      .where('uq.results IS NOT NULL')
      .orderBy('uq.timestamp', 'DESC');
      
    if (userId) {
      queryBuilder.andWhere('uq.user_id = :userId', { userId });
    }
    
    return queryBuilder.getMany();
  }

  /**
   * Find recent queries
   * @param userId The user ID (optional)
   * @param limit The maximum number of queries to return
   * @returns Array of recent queries
   */
  async findRecentQueries(userId?: number, limit: number = 10): Promise<UserQuery[]> {
    return this.findAll({
      where: userId ? { userId } : {},
      order: { timestamp: 'DESC' },
      take: limit,
    });
  }

  /**
   * Save query results
   * @param id The query ID
   * @param results The results to save
   * @returns The updated query
   */
  async saveResults(id: number, results: Record<string, any>): Promise<UserQuery> {
    return this.update(id, { results });
  }

  /**
   * Create a new query in a session
   * @param userId The user ID
   * @param query The query text
   * @param sessionId The session ID
   * @param isConversational Whether the query is conversational
   * @returns The created query
   */
  async createQueryInSession(
    userId: number,
    query: string,
    sessionId: string,
    isConversational: boolean = false,
  ): Promise<UserQuery> {
    return this.create({
      userId,
      query,
      sessionId,
      isConversational,
      timestamp: new Date(),
    });
  }
}