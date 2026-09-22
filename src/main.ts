import 'reflect-metadata';

import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { VersioningType } from '@nestjs/common';

import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const port = configService.get('APP_PORT');

  app.enableCors({
    origin: '*', // Allow requests from this domain
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS', // Allow these methods
    allowedHeaders: 'Content-Type, Authorization', // Allow these headers
  });

  app.enableVersioning({
    type: VersioningType.URI,
  });
  app.setGlobalPrefix('api', {
    exclude: ['', '/debug-sentry'],
  });

  await app.listen(port ?? 8000);
}
bootstrap();
