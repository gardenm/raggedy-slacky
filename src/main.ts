import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);
  
  // Set global prefix for all routes
  app.setGlobalPrefix('api');
  
  // Configure global validation pipe
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    transform: true,
    forbidNonWhitelisted: true,
    transformOptions: {
      enableImplicitConversion: true,
    },
  }));
  
  // Configure global exception filter
  app.useGlobalFilters(new HttpExceptionFilter());
  
  // Configure global interceptors
  app.useGlobalInterceptors(new LoggingInterceptor());
  
  // Enable CORS
  app.enableCors();
  
  // Get configuration
  const configService = app.get(ConfigService);
  const port = configService.get<number>('port', 3000);
  const nodeEnv = configService.get<string>('nodeEnv', 'development');
  
  // Start the application
  await app.listen(port);
  
  logger.log(`Application is running in ${nodeEnv} mode on: http://localhost:${port}`);
  logger.log(`API documentation available at: http://localhost:${port}/api`);
}

bootstrap().catch(err => {
  const logger = new Logger('Bootstrap');
  logger.error(`Failed to start application: ${err.message}`, err.stack);
  process.exit(1);
});