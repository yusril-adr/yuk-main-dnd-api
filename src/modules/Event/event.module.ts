import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CqrsModule } from '@nestjs/cqrs';
import { EventEntity } from '@entities/main/event/event.entity';
import { EventMember } from '@entities/main/event/event-member.entity';
import { File } from '@entities/main/file.entity';
import { EventController } from './controllers/event.controller';
import { MasterEventController } from './controllers/master-event.controller';
import { EventRepository } from './repositories/event.repository';
import { EventService } from './services/event.service';
import { EventPermissionService } from './services/event-permission.service';
import { EventMasterActionService } from './services/event-master-action.service';
import { CreateEventHandler } from './commands/master/create-event/create-event.handler';
import { UpdateEventHandler } from './commands/master/update-event/update-event.handler';
import { RemoveEventHandler } from './commands/master/remove-event/remove-event.handler';
import { PaginateEventsHandler } from './queries/master/paginate-events/paginate-events.handler';
import { FindOneEventHandler } from './queries/master/find-one-event/find-one-event.handler';
import { PaginateEventsHandler as PublicPaginateEventsHandler } from './queries/paginate-events/paginate-events.handler';
import { FindOneEventHandler as PublicFindOneEventHandler } from './queries/find-one-event/find-one-event.handler';

@Module({
  imports: [
    TypeOrmModule.forFeature([EventEntity, EventMember, File]),
    CqrsModule,
  ],
  controllers: [EventController, MasterEventController],
  providers: [
    EventRepository,
    EventService,
    EventPermissionService,
    EventMasterActionService,
    CreateEventHandler,
    UpdateEventHandler,
    RemoveEventHandler,
    PaginateEventsHandler,
    FindOneEventHandler,
    PublicPaginateEventsHandler,
    PublicFindOneEventHandler,
  ],
})
export class EventModule {}
