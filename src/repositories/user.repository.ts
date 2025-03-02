import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import { BaseRepository } from './base.repository';

@Injectable()
export class UserRepository extends BaseRepository<User> {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {
    super(userRepository);
  }

  /**
   * Find a user by username
   * @param username The username to search for
   * @returns The user or null if not found
   */
  async findByUsername(username: string): Promise<User | null> {
    return this.findOne({ where: { username } });
  }

  /**
   * Find a user by email
   * @param email The email to search for
   * @returns The user or null if not found
   */
  async findByEmail(email: string): Promise<User | null> {
    return this.findOne({ where: { email } });
  }

  /**
   * Find admin users
   * @returns Array of admin users
   */
  async findAdmins(): Promise<User[]> {
    return this.findAll({ where: { isAdmin: true } });
  }

  /**
   * Update user's last login time
   * @param id User ID
   * @returns The updated user
   */
  async updateLastLogin(id: number): Promise<User> {
    return this.update(id, { lastLogin: new Date() });
  }
}