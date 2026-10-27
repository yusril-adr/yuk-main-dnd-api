import 'reflect-metadata';

import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { VersioningType } from '@nestjs/common';
import * as Sentry from '@sentry/nestjs';

import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const port = configService.get('APP_PORT');

  if (configService.get('SENTRY_ENABLED') === 'true') {
    Sentry.init({
      dsn: configService.get('SENTRY_DSN'),
      attachStacktrace: true,
      debug: configService.get('NODE_ENV') === 'development',
      environment: configService.get('NODE_ENV'),
      beforeSend: async (event, hint) => {
        const error = hint.originalException as Error;

        const errorMessage =
          event?.message || error['message'] || 'Unknown error';

        const errorName =
          event?.exception?.values?.[0]?.type ||
          error['name'] ||
          'Unknown error type';

        const errorStack =
          event?.exception?.values?.[0]?.stacktrace?.frames?.[0]?.function ||
          error['stack'] ||
          'Unknown stack trace';

        const embeds = [
          {
            title: `🚨 Error occured on ${configService.get('APP_NAME')}`,
            description: `
            **${errorStack}**
            \`\`\`${errorName}: ${errorMessage}\`\`\`
          `,
            color: 16711680,
            fields: [
              { name: 'Environment', value: event.environment || 'unknown' },
              { name: 'Level', value: event.level || 'error' },
            ],
          },
        ];
        const sentryIssueLink = `${configService.get('SENTRY_ISSUES_BASE_URL')}/issues/?project=${configService.get('SENTRY_PROJECT_ID')}&query=id%3A${event.event_id}&referrer=issue-list`;

        const discordWebhookUrl = configService.get(
          'SENTRY_DISCORD_WEBHOOK_URL',
        );
        const response = await fetch(discordWebhookUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            content: `Halo kakak-kakak, ada error nih di [sini](${sentryIssueLink}). Semangat ya!`,
            embeds,
          }),
        });

        if (!response.ok) {
          console.error('Failed to send error to Discord', response.statusText);
        }

        return event;
      },
    });
  }

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
