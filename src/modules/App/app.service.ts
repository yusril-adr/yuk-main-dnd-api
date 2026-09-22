import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  checkStatusRunning(): string {
    return 'This service is running properly';
  }
}
