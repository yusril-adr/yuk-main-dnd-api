import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
  InternalServerErrorException,
  ConflictException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { Response } from 'express';
import * as Sentry from '@sentry/nestjs';
import { EntityNotFoundError, QueryFailedError, TypeORMError } from 'typeorm';
import { camelToSnake } from '@shared/utils/common';
import { AppConfigService } from '@modules/Global/services/app-config.service';

// Postgres error codes that are caused by the request data. Anything else is
// answered with a 500. Messages are generic so no table, column or SQL text
// leaks to the client.
const DB_ERROR_RESPONSES: Record<
  string,
  { status: HttpStatus; message: string; error: string }
> = {
  '23505': {
    status: HttpStatus.CONFLICT,
    message: 'Data already exists',
    error: ConflictException.name,
  },
  ...Object.fromEntries(
    ['23502', '23503', '22P02', '22003', '22001'].map((code) => [
      code,
      {
        status: HttpStatus.BAD_REQUEST,
        message: 'Invalid request data',
        error: BadRequestException.name,
      },
    ]),
  ),
};

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  constructor(private readonly appConfigService: AppConfigService) {}

  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    const applicationContext = host.getType();

    if (applicationContext === 'http') {
      // Handle for application context of regular HTTP requests (REST)
      this.httpExceptionResponse(exception, host);
      return;
    } else if (applicationContext === 'rpc') {
      // Handle for application context of RPC (Microservice requests)
      //TODO: implement this
    } else if (applicationContext === 'ws') {
      // Handle for application context of WS (Websocket requests)
      //TODO: implement this
    }

    this.reportException(exception);

    // Send the transformed response
    response.status(HttpStatus.INTERNAL_SERVER_ERROR).json(
      camelToSnake({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Internal server error',
        error: InternalServerErrorException.name,
        ...this.debugBody(exception),
      }),
    );
  }

  private httpExceptionResponse(exception: any, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let responseBody: string | object = {
      message: 'Internal server error',
      error: InternalServerErrorException.name,
    };

    const handledExceptions: Record<string, () => void> = {
      // Handle HTTP exceptions
      [HttpException.name]: () => {
        status = exception.getStatus();
        const rawResponse = exception.getResponse();
        responseBody =
          typeof rawResponse === 'string'
            ? { message: rawResponse, error: exception.name }
            : { ...rawResponse, error: exception.name };
      },

      // Handle TypeORM exceptions
      [QueryFailedError.name]: () => {
        const dbError = DB_ERROR_RESPONSES[exception.driverError?.code];
        status = dbError?.status ?? HttpStatus.INTERNAL_SERVER_ERROR;
        responseBody = {
          error: dbError?.error ?? InternalServerErrorException.name,
          message: dbError?.message ?? 'Internal server error',
          ...this.debugBody(exception),
        };

        this.reportException(exception);
      },

      [TypeORMError.name]: () => {
        // QueryFailedError extends TypeORMError, so the parent name lookup
        // lands here for it.
        if (exception instanceof QueryFailedError) {
          handledExceptions[QueryFailedError.name]();
          return;
        }

        const isNotFound = exception instanceof EntityNotFoundError;
        status = isNotFound
          ? HttpStatus.NOT_FOUND
          : HttpStatus.INTERNAL_SERVER_ERROR;
        responseBody = {
          error: isNotFound
            ? NotFoundException.name
            : InternalServerErrorException.name,
          message: isNotFound ? 'Data not found' : 'Internal server error',
          ...this.debugBody(exception),
        };

        this.reportException(exception);
      },
    };
    const exceptionParentName = Object.getPrototypeOf(
      exception.constructor,
    ).name;

    const handleException = handledExceptions[exceptionParentName];
    if (handleException) {
      handleException();
    } else {
      responseBody = { ...responseBody, ...this.debugBody(exception) };
      this.reportException(exception);
    }

    // Send the transformed response
    response.status(status).json(
      camelToSnake({
        ...responseBody,
        statusCode: status,
      }),
    );
  }

  // Only filled when APP_DEBUG=true. Never use it for HttpException, whose
  // message is already meant for the client.
  private debugBody(exception: any): object {
    if (!this.appConfigService.debug) {
      return {};
    }

    return {
      debug: {
        name: exception?.name,
        message: exception?.message ?? String(exception),
        stack: exception?.stack,
        ...(exception instanceof QueryFailedError && {
          code: exception.driverError?.code,
          detail: exception.driverError?.detail,
        }),
      },
    };
  }

  private reportException(exception: any): void {
    this.logger.error(exception, exception.stack);
    Sentry.captureException(exception);
  }
}
