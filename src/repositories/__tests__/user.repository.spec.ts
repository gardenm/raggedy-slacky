import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../entities/user.entity';
import { UserRepository } from '../user.repository';
import { createMockRepository, createSampleData } from './test-utils';
import { NotFoundException } from '@nestjs/common';

describe('UserRepository', () => {
  let repository: UserRepository;
  let mockRepository: jest.Mocked<Repository<User>>;
  const sampleData = createSampleData();

  beforeEach(async () => {
    mockRepository = createMockRepository<User>();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserRepository,
        {
          provide: getRepositoryToken(User),
          useValue: mockRepository,
        },
      ],
    }).compile();

    repository = module.get<UserRepository>(UserRepository);
  });

  it('should be defined', () => {
    expect(repository).toBeDefined();
  });

  describe('findByUsername', () => {
    it('should find a user by username', async () => {
      const user = sampleData.users[0];
      mockRepository.findOne.mockResolvedValue(user);

      const result = await repository.findByUsername('admin');
      
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { username: 'admin' },
      });
      expect(result).toEqual(user);
    });

    it('should return null if user is not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      const result = await repository.findByUsername('nonexistent');
      
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { username: 'nonexistent' },
      });
      expect(result).toBeNull();
    });
  });

  describe('findByEmail', () => {
    it('should find a user by email', async () => {
      const user = sampleData.users[0];
      mockRepository.findOne.mockResolvedValue(user);

      const result = await repository.findByEmail('admin@example.com');
      
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { email: 'admin@example.com' },
      });
      expect(result).toEqual(user);
    });

    it('should return null if user is not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      const result = await repository.findByEmail('nonexistent@example.com');
      
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { email: 'nonexistent@example.com' },
      });
      expect(result).toBeNull();
    });
  });

  describe('findAdmins', () => {
    it('should find admin users', async () => {
      const adminUsers = [sampleData.users[0]];
      mockRepository.find.mockResolvedValue(adminUsers);

      const result = await repository.findAdmins();
      
      expect(mockRepository.find).toHaveBeenCalledWith({
        where: { isAdmin: true },
      });
      expect(result).toEqual(adminUsers);
    });
  });

  describe('updateLastLogin', () => {
    it('should update the last login time', async () => {
      const updatedDate = new Date();
      const user = { 
        ...sampleData.users[0], 
        lastLogin: updatedDate 
      };
      
      mockRepository.findOne.mockResolvedValue(sampleData.users[0]);
      mockRepository.merge.mockReturnValue(user);
      mockRepository.save.mockResolvedValue(user);

      const result = await repository.updateLastLogin(1);
      
      expect(mockRepository.findOne).toHaveBeenCalled();
      expect(mockRepository.save).toHaveBeenCalled();
      expect(result.lastLogin).toEqual(updatedDate);
    });

    it('should throw NotFoundException if user is not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(repository.updateLastLogin(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('base repository methods', () => {
    it('should find a user by id', async () => {
      const user = sampleData.users[0];
      mockRepository.findOne.mockResolvedValue(user);

      const result = await repository.findById(1);
      
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
      });
      expect(result).toEqual(user);
    });

    it('should create a new user', async () => {
      const newUser = {
        username: 'newuser',
        email: 'newuser@example.com',
        passwordHash: 'hashed_password',
        isAdmin: false,
      };
      
      const createdUser = { 
        id: 3, 
        ...newUser, 
        createdAt: new Date(), 
        lastLogin: new Date(), // Use a Date object instead of null
        queries: [],
        conversations: [] 
      };
      
      mockRepository.create.mockReturnValue(createdUser);
      mockRepository.save.mockResolvedValue(createdUser);

      const result = await repository.create(newUser);
      
      expect(mockRepository.create).toHaveBeenCalledWith(newUser);
      expect(mockRepository.save).toHaveBeenCalledWith(createdUser);
      expect(result).toEqual(createdUser);
    });

    it('should update a user', async () => {
      const user = sampleData.users[0];
      const updateData = { username: 'updated_admin' };
      const updatedUser = { 
        ...user, 
        ...updateData 
      };
      
      mockRepository.findOne.mockResolvedValue(user);
      mockRepository.merge.mockReturnValue(updatedUser);
      mockRepository.save.mockResolvedValue(updatedUser);

      const result = await repository.update(1, updateData);
      
      expect(mockRepository.findOne).toHaveBeenCalled();
      expect(mockRepository.merge).toHaveBeenCalledWith(user, updateData);
      expect(mockRepository.save).toHaveBeenCalledWith(updatedUser);
      expect(result).toEqual(updatedUser);
    });

    it('should remove a user', async () => {
      const user = sampleData.users[0];
      
      mockRepository.findOne.mockResolvedValue(user);
      mockRepository.remove.mockResolvedValue(user);

      const result = await repository.remove(1);
      
      expect(mockRepository.findOne).toHaveBeenCalled();
      expect(mockRepository.remove).toHaveBeenCalledWith(user);
      expect(result).toEqual(user);
    });
  });
});