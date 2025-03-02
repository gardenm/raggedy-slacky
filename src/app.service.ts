import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import * as os from 'os';

@Injectable()
export class AppService {
  constructor(
    private configService: ConfigService,
    @InjectDataSource() private dataSource: DataSource,
  ) {}

  getHealth() {
    return {
      status: 'ok',
      timestamp: new Date(),
    };
  }

  async getDetailedHealth() {
    let databaseStatus = 'ok';
    let databaseError = null;

    // Check database connection
    try {
      const connected = this.dataSource.isInitialized;
      if (!connected) {
        databaseStatus = 'error';
        databaseError = 'Database connection not initialized';
      }
    } catch (error) {
      databaseStatus = 'error';
      databaseError = error.message;
    }

    // Get system information
    const memoryUsage = process.memoryUsage();
    const uptime = process.uptime();
    const systemUptime = os.uptime();
    const cpuLoad = os.loadavg();
    const freeMemory = os.freemem();
    const totalMemory = os.totalmem();

    // Get environment info
    const nodeEnv = this.configService.get('NODE_ENV', 'development');
    const appVersion = process.env.npm_package_version || '0.1.0';

    return {
      status: databaseStatus === 'ok' ? 'ok' : 'degraded',
      timestamp: new Date(),
      version: appVersion,
      environment: nodeEnv,
      uptime: {
        app: {
          seconds: uptime,
          formatted: this.formatUptime(uptime),
        },
        system: {
          seconds: systemUptime,
          formatted: this.formatUptime(systemUptime),
        },
      },
      system: {
        cpuLoad: cpuLoad,
        memory: {
          free: this.formatBytes(freeMemory),
          total: this.formatBytes(totalMemory),
          percentFree: Math.round((freeMemory / totalMemory) * 100),
        },
        platform: process.platform,
        arch: process.arch,
      },
      process: {
        memory: {
          rss: this.formatBytes(memoryUsage.rss),
          heapTotal: this.formatBytes(memoryUsage.heapTotal),
          heapUsed: this.formatBytes(memoryUsage.heapUsed),
          external: this.formatBytes(memoryUsage.external),
        },
        pid: process.pid,
      },
      services: {
        database: {
          status: databaseStatus,
          error: databaseError,
          type: this.dataSource.options.type,
          name: this.dataSource.options.database,
        },
      },
    };
  }

  private formatUptime(seconds: number): string {
    const days = Math.floor(seconds / (3600 * 24));
    const hours = Math.floor((seconds % (3600 * 24)) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    
    return `${days}d ${hours}h ${minutes}m ${remainingSeconds}s`;
  }

  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}