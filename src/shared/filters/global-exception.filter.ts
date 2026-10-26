import {
  ArgumentsHost,
  BadRequestException,
  Catch,
  ConflictException,
  ExceptionFilter,
  HttpException,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Request, Response } from 'express';
import * as Sentry from '@sentry/nestjs';
import { EntityNotFoundError, QueryFailedError } from 'typeorm';
import { camelToSnake } from '@shared/utils/common';
import { AppConfigService } from '@modules/Global/services/app-config.service';
import { TErrorDebug, TErrorResponse } from '@shared/types/error-response.type';

// Postgres errors caused by bad input. The client gets a generic message;
// table, column, constraint and SQL details only go to the server log.
const DB_ERROR_EXCEPTIONS: Record<string, () => HttpException> = {
  // unique_violation
  '23505': () => new ConflictException('Data already exists'),
  // not_null_violation
  '23502': () => new BadRequestException('Invalid request data'),
  // foreign_key_violation
  '23503': () => new BadRequestException('Invalid request data'),
  // invalid_text_representation (e.g. a malformed uuid)
  '22P02': () => new BadRequestException('Invalid request data'),
  // numeric_value_out_of_range
  '22003': () => new BadRequestException('Invalid request data'),
  // string_data_right_truncation
  '22001': () => new BadRequestException('Invalid request data'),
};

type TResolvedException = {
  httpException: HttpException;
  // The error we replaced with a generic one; undefined for HttpExceptions.
  originalError?: unknown;
};

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  constructor(private readonly appConfigService: AppConfigService) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    if (host.getType() !== 'http') {
      // Only HTTP is served. RPC/WS would need their own response format.
      this.logger.error(
        `Unhandled ${host.getType()} exception`,
        this.toDebug(exception).stack,
      );
      Sentry.captureException(exception);
      return;
    }

    const ctx = host.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();

    const { httpException, originalError } = this.resolve(exception);
    const status = httpException.getStatus();

    this.log(request, status, exception, originalError !== undefined);

    const body: TErrorResponse = {
      ...this.toResponseBody(httpException),
      statusCode: status,
    };
    if (originalError !== undefined && this.appConfigService.debug) {
      body.debug = this.toDebug(originalError);
    }

    response.status(status).json(camelToSnake(body));
  }

  private resolve(exception: unknown): TResolvedException {
    if (exception instanceof HttpException) {
      return { httpException: exception };
    }

    if (exception instanceof QueryFailedError) {
      const createException = DB_ERROR_EXCEPTIONS[this.getDbCode(exception)];
      if (createException) {
        return { httpException: createException(), originalError: exception };
      }
    }

    if (exception instanceof EntityNotFoundError) {
      return {
        httpException: new NotFoundException('Data not found'),
        originalError: exception,
      };
    }

    return {
      httpException: new InternalServerErrorException('Internal server error'),
      originalError: exception,
    };
  }

  // Same shape as before: the HttpException response plus its class name.
  private toResponseBody(
    exception: HttpException,
  ): Omit<TErrorResponse, 'statusCode'> {
    const rawResponse = exception.getResponse();
    return typeof rawResponse === 'string'
      ? { message: rawResponse, error: exception.name }
      : {
          ...(rawResponse as { message: unknown }),
          error: exception.name,
        };
  }

  // Request bodies are never logged since they can hold passwords.
  private log(
    request: Request,
    status: number,
    exception: unknown,
    isReplaced: boolean,
  ): void {
    const isServerError = status >= 500;
    if (!isServerError && !isReplaced) {
      // Expected 4xx HttpExceptions (validation, auth, not found, ...).
      return;
    }

    const debug = this.toDebug(exception);
    const path = request.originalUrl.split('?')[0];
    const dbInfo = debug.code
      ? ` [${debug.code}]${debug.detail ? ` ${debug.detail}` : ''}`
      : '';
    const summary = `${request.method} ${path} -> ${status} ${debug.name}: ${debug.message}${dbInfo}`;

    if (isServerError) {
      this.logger.error(summary, debug.stack);
    } else {
      this.logger.warn(`${summary}\n${debug.stack ?? ''}`);
    }

    Sentry.captureException(exception);
  }

  private toDebug(error: unknown): TErrorDebug {
    if (!(error instanceof Error)) {
      return { name: 'UnknownError', message: String(error) };
    }

    const debug: TErrorDebug = {
      name: error.name,
      message: error.message,
      stack: error.stack,
    };
    if (error instanceof QueryFailedError) {
      debug.code = this.getDbCode(error);
      const detail = (error.driverError as { detail?: unknown })?.detail;
      if (typeof detail === 'string') {
        debug.detail = detail;
      }
    }

    return debug;
  }

  private getDbCode(error: QueryFailedError): string {
    return `${(error.driverError as { code?: unknown })?.code ?? ''}`;
  }
}
