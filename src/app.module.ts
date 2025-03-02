import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import * as entities from './entities';
import { UsersModule } from './modules/users/users.module';
import { AuthModule } from './modules/auth/auth.module';
import { SearchModule } from './modules/search/search.module';
import { RagModule } from './modules/rag/rag.module';
import { SlackModule } from './modules/slack/slack.module';
import { VectorModule } from './modules/vector/vector.module';
import configuration from './config/configuration';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      cache: true,
    }),
    
    // Database
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('database.host'),
        port: configService.get<number>('database.port'),
        username: configService.get('database.username'),
        password: configService.get('database.password'),
        database: configService.get('database.database'),
        entities: Object.values(entities),
        migrations: ['dist/migrations/*.js'],
        migrationsRun: configService.get('database.autoMigrate'),
        synchronize: configService.get('nodeEnv') === 'development',
        logging: configService.get('database.logging'),
      }),
    }),
    
    // Feature modules
    UsersModule,
    AuthModule,
    SearchModule,
    RagModule,
    SlackModule,
    // Vector Database
    VectorModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}