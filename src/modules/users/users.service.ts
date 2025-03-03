import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../entities/user.entity';
import * as argon2 from 'argon2-browser';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async findOne(username: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { username } });
  }

  async findById(id: number): Promise<User | null> {
    return this.usersRepository.findOne({ where: { id } });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { email } });
  }

  async create(username: string, email: string, password: string): Promise<User> {
    try {
      // Use argon2-browser for password hashing (pure JS implementation)
      const hashResult = await argon2.hash({
        pass: password,
        salt: new TextEncoder().encode('randomsalt' + Date.now()), // Pseudo-random salt for browser compatibility
        time: 3, // Number of iterations
        mem: 4096, // Memory to use in KiB
        parallelism: 1, // Parallelism factor
        hashLen: 32, // Output size
        type: argon2.ArgonType.Argon2id // Use Argon2id variant (recommended)
      });
      
      // hashResult.encoded contains the full hash in the PHC format
      const passwordHash = hashResult.encoded;

      const user = this.usersRepository.create({
        username,
        email,
        passwordHash,
      });

      return this.usersRepository.save(user);
    } catch (error) {
      Logger.error('Error creating user with argon2 hash:', error);
      
      // Fallback for development
      if (process.env.NODE_ENV === 'development') {
        Logger.debug('DEV MODE: Using fallback hashing method');
        
        // In development, just store the password with a simple prefix
        // This is NOT secure and only for development testing
        const passwordHash = `$argon2dev$${password}`;
        
        const user = this.usersRepository.create({
          username,
          email,
          passwordHash,
        });

        return this.usersRepository.save(user);
      }
      
      throw error;
    }
  }

  async updateLastLogin(userId: number): Promise<void> {
    await this.usersRepository.update(userId, {
      lastLogin: new Date(),
    });
  }
}