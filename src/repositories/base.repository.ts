import { Repository, FindOptionsWhere, FindOneOptions, FindManyOptions, DeepPartial, ObjectLiteral } from 'typeorm';
import { NotFoundException } from '@nestjs/common';

/**
 * Base repository providing common CRUD operations for all entities
 */
export class BaseRepository<T extends ObjectLiteral> {
  constructor(private readonly repository: Repository<T>) {}

  /**
   * Find an entity by its ID
   * @param id The entity ID
   * @param options Additional find options
   * @returns The found entity or null
   */
  async findById(id: number, options?: Omit<FindOneOptions<T>, 'where'>): Promise<T | null> {
    const params: FindOneOptions<T> = { ...options, where: { id } as unknown as FindOptionsWhere<T> };
    return this.repository.findOne(params);
  }

  /**
   * Find an entity by ID or throw a NotFoundException
   * @param id The entity ID
   * @param options Additional find options
   * @returns The found entity
   * @throws NotFoundException if entity is not found
   */
  async findByIdOrFail(id: number, options?: Omit<FindOneOptions<T>, 'where'>): Promise<T> {
    const entity = await this.findById(id, options);
    if (!entity) {
      throw new NotFoundException(`Entity with ID ${id} not found`);
    }
    return entity;
  }

  /**
   * Find one entity matching the specified criteria
   * @param options Find options
   * @returns The found entity or null
   */
  async findOne(options: FindOneOptions<T>): Promise<T | null> {
    return this.repository.findOne(options);
  }

  /**
   * Find one entity matching the specified criteria or throw a NotFoundException
   * @param options Find options
   * @returns The found entity
   * @throws NotFoundException if entity is not found
   */
  async findOneOrFail(options: FindOneOptions<T>): Promise<T> {
    const entity = await this.findOne(options);
    if (!entity) {
      throw new NotFoundException('Entity not found');
    }
    return entity;
  }

  /**
   * Find all entities matching the specified criteria
   * @param options Find options
   * @returns Array of entities
   */
  async findAll(options?: FindManyOptions<T>): Promise<T[]> {
    return this.repository.find(options);
  }

  /**
   * Create a new entity
   * @param data Entity data
   * @returns The created entity
   */
  async create(data: DeepPartial<T>): Promise<T> {
    const entity = this.repository.create(data);
    return this.repository.save(entity as any);
  }

  /**
   * Update an entity by ID
   * @param id The entity ID
   * @param data The update data
   * @returns The updated entity
   * @throws NotFoundException if entity is not found
   */
  async update(id: number, data: DeepPartial<T>): Promise<T> {
    const entity = await this.findByIdOrFail(id);
    const updated = this.repository.merge(entity, data as any);
    return this.repository.save(updated as any);
  }

  /**
   * Remove an entity by ID
   * @param id The entity ID
   * @returns The removed entity
   * @throws NotFoundException if entity is not found
   */
  async remove(id: number): Promise<T> {
    const entity = await this.findByIdOrFail(id);
    const result = await this.repository.remove(entity as any);
    return Array.isArray(result) ? result[0] : result;
  }

  /**
   * Count entities matching the specified criteria
   * @param options Find options
   * @returns The count
   */
  async count(options?: FindManyOptions<T>): Promise<number> {
    return this.repository.count(options);
  }

  /**
   * Check if an entity exists
   * @param options Find options
   * @returns True if entity exists, false otherwise
   */
  async exists(options: FindOneOptions<T>): Promise<boolean> {
    const count = await this.repository.count({
      ...options,
      take: 1,
    });
    return count > 0;
  }
  
  /**
   * Get the repository instance
   * @returns The TypeORM repository
   */
  getRepository(): Repository<T> {
    return this.repository;
  }
}