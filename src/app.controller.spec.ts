import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigService } from '@nestjs/config';
import { DataSource } from 'typeorm';
import * as os from 'os';

describe('AppController', () => {
  let appController: AppController;
  let appService: AppService;

  beforeEach(async () => {
    // Create mock dependencies
    const mockConfigService = {
      get: jest.fn((key, defaultValue) => {
        if (key === 'NODE_ENV') return 'test';
        return defaultValue;
      }),
    };

    const mockDataSource = {
      isInitialized: true,
      options: {
        type: 'postgres',
        database: 'test_db',
      },
    };

    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        AppService,
        { provide: ConfigService, useValue: mockConfigService },
        { provide: DataSource, useValue: mockDataSource },
      ],
    }).compile();

    appController = app.get<AppController>(AppController);
    appService = app.get<AppService>(AppService);
  });

  describe('getHealth', () => {
    it('should return basic health status', () => {
      // Test basic health endpoint
      expect(appController.getHealth()).toEqual({
        status: 'ok',
        timestamp: expect.any(Date),
      });
    });
  });

  describe('getDetailedHealth', () => {
    it('should return detailed health information', async () => {
      // Mock the detailed health method with correct platform type
      const mockHealthData = {
        status: 'ok',
        timestamp: new Date(),
        version: '0.1.0',
        environment: 'test',
        uptime: {
          app: {
            seconds: 123,
            formatted: '0d 0h 2m 3s',
          },
          system: {
            seconds: 12345,
            formatted: '0d 3h 25m 45s',
          },
        },
        system: {
          cpuLoad: [0.1, 0.2, 0.3],
          memory: {
            free: '1.5 GB',
            total: '8 GB',
            percentFree: 20,
          },
          platform: process.platform,
          arch: process.arch,
        },
        process: {
          memory: {
            rss: '100 MB',
            heapTotal: '50 MB',
            heapUsed: '30 MB',
            external: '10 MB',
          },
          pid: 1234,
        },
        services: {
          database: {
            status: 'ok',
            error: null,
            type: 'postgres' as const,
            name: 'test_db',
          },
        },
      };
      
      jest.spyOn(appService, 'getDetailedHealth').mockResolvedValue(mockHealthData);
      
      // Test API health endpoint
      const result = await appController.getDetailedHealth();
      expect(result).toEqual(mockHealthData);
      expect(appService.getDetailedHealth).toHaveBeenCalled();
    });

    it('should report degraded status when database has issues', async () => {
      // Mock a degraded state with correct platform type
      const mockDegradedData = {
        status: 'degraded',
        timestamp: new Date(),
        version: '0.1.0',
        environment: 'test',
        uptime: {
          app: {
            seconds: 123,
            formatted: '0d 0h 2m 3s',
          },
          system: {
            seconds: 12345,
            formatted: '0d 3h 25m 45s',
          },
        },
        system: {
          cpuLoad: [0.1, 0.2, 0.3],
          memory: {
            free: '1.5 GB',
            total: '8 GB',
            percentFree: 20,
          },
          platform: process.platform,
          arch: process.arch,
        },
        process: {
          memory: {
            rss: '100 MB',
            heapTotal: '50 MB',
            heapUsed: '30 MB',
            external: '10 MB',
          },
          pid: 1234,
        },
        services: {
          database: {
            status: 'error',
            error: 'Connection failed',
            type: 'postgres' as const,
            name: 'test_db',
          },
        },
      };
      
      jest.spyOn(appService, 'getDetailedHealth').mockResolvedValue(mockDegradedData);
      
      // Test API health endpoint with degraded status
      const result = await appController.getDetailedHealth();
      expect(result.status).toEqual('degraded');
      expect(result.services.database.status).toEqual('error');
    });
  });
});