import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { snakeToCamel } from '@shared/utils/common';

@Injectable()
export class RequestInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();

    if (request.body) {
      request.body = snakeToCamel(request.body);
    }

    if (request.query && Object.keys(request.query).length > 0) {
      Object.defineProperty(request, 'query', {
        value: { ...request.query },
        writable: true,
        configurable: true,
        enumerable: true,
      });

      request.query = snakeToCamel(request.query);

      // Remove empty string values from query
      Object.entries(request.query).forEach(([key, value]) => {
        if (typeof value === 'string' && value === '') {
          request.query[key] = undefined;
        }
      });
    }

    return next.handle();
  }
}
