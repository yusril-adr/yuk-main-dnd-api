import { join } from 'path';
import { BadRequestException, Module, ValidationPipe } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ServeStaticModule } from '@nestjs/serve-static';
import { snakeCase } from 'typeorm/util/StringUtils.js';

import requestorDb from '@infrastructure/databases/main.ds';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';
import { AccessTokenGuard } from '@shared/guards/access-token.guard';
import { PermissionsGuard } from '@shared/guards/permissions.guard';
import { DeprecatedGuard } from '@shared/guards/deprecated.guard';
import { replaceAllCamelCaseToSnakeCase } from '@shared/utils/common';
import { RequestInterceptor } from '@shared/interceptors/request.interceptor';
import { ResponseInterceptor } from '@shared/interceptors/response.interceptor';
import { GlobalExceptionFilter } from '@shared/filters/global-exception.filter';

import { AuthModule } from '@modules/Auth/auth.module';
import { UserModule } from '@modules/Master/Iam/User/user.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      ignoreEnvVars: process.env.NODE_ENV === 'production',
    }),
    TypeOrmModule.forRootAsync({
      useFactory: async () => ({
        ...requestorDb.options,
        autoLoadEntities: true,
      }),
    }),
    ServeStaticModule.forRoot({
      rootPath: join(process.cwd(), 'public'),
      serveRoot: '/public',
      serveStaticOptions: {
        fallthrough: true,
      },
    }),

    AuthModule,
    UserModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: AccessTokenGuard,
    },
    {
      provide: APP_GUARD,
      useClass: PermissionsGuard,
    },
    {
      provide: APP_GUARD,
      useClass: DeprecatedGuard,
    },
    {
      provide: APP_PIPE,
      useFactory: () =>
        new ValidationPipe({
          transform: true,
          exceptionFactory: (errors) => {
            const flattenErrors = (
              validationErrors: any[],
              parentPath = '',
            ): any[] => {
              return validationErrors.flatMap((error) => {
                const path = parentPath
                  ? `${parentPath}.${snakeCase(error.property)}`
                  : snakeCase(error.property);

                if (error.constraints) {
                  return {
                    property: path,
                    messages: Object.keys(error.constraints).map((key) =>
                      replaceAllCamelCaseToSnakeCase(error.constraints[key]),
                    ),
                  };
                }
                if (error.children?.length) {
                  return flattenErrors(error.children, path);
                }
                return [];
              });
            };

            const result = flattenErrors(errors);
            return new BadRequestException(result);
          },
        }),
    },
    {
      // Convert request keys to CamelCase
      provide: APP_INTERCEPTOR,
      useClass: RequestInterceptor,
    },
    {
      // Convert response keys to snake_case
      provide: APP_INTERCEPTOR,
      useClass: ResponseInterceptor,
    },
    {
      provide: APP_FILTER,
      useClass: GlobalExceptionFilter,
    },
  ],
})
export class AppModule {}
