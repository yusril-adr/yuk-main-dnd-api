import { Module } from '@nestjs/common';
import { AppController } from '@modules/App/app.controller';
import { AppService } from '@modules/App/app.service';

@Module({
  imports: [],
  controllers: [AppController],
  providers: [AppService],
  exports: [AppService],
})
export class AppModule {}
