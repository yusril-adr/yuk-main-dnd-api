import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
  InternalServerErrorException,
} from '@nestjs/common';
import { Response } from 'express';
import * as Sentry from '@sentry/nestjs';
import { QueryFailedError } from 'typeorm';
import { camelToSnake } from '@shared/utils/common';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

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

    // Log the exception
    this.logger.error(exception, exception.stack);
    Sentry.captureException(exception);

    // Send the transformed response
    response.status(HttpStatus.INTERNAL_SERVER_ERROR).json(
      camelToSnake({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Internal server error',
        error: InternalServerErrorException,
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

    const handledExceptions = {
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
        status = HttpStatus.BAD_REQUEST;
        responseBody = {
          error: exception.name,
          message: exception.message,
        };

        this.logger.error(exception, exception.stack);
        Sentry.captureException(exception);
      },
    };
    const exceptionParentName = Object.getPrototypeOf(
      exception.constructor,
    ).name;

    const handleException = handledExceptions[exceptionParentName];
    if (handleException) {
      handleException();
    } else {
      this.logger.error(exception, exception.stack);
      Sentry.captureException(exception);
    }

    // Send the transformed response
    response.status(status).json(
      camelToSnake({
        ...responseBody,
        statusCode: status,
      }),
    );
  }
}
