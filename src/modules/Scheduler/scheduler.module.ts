import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { EventModule } from '@modules/Event/event.module';
import { StoryModule } from '@modules/Story/story.module';
import { ScheduleController } from './controllers/schedule.controller';
import { ListSchedulesHandler } from './queries/list-schedules/list-schedules.handler';

const queryHandlers = [ListSchedulesHandler];

@Module({
  imports: [EventModule, StoryModule, CqrsModule],
  controllers: [ScheduleController],
  providers: [...queryHandlers],
})
export class SchedulerModule {}
