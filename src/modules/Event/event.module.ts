import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CqrsModule } from '@nestjs/cqrs';
import { EventEntity } from '@entities/main/event/event.entity';
import { EventMember } from '@entities/main/event/event-member.entity';
import { File } from '@entities/main/file.entity';
import { UserModule } from '@modules/Iam/User/user.module';
import { EventController } from './controllers/event.controller';
import { MasterEventController } from './controllers/master-event.controller';
import { EventRepository } from './repositories/event.repository';
import { EventService } from './services/event.service';
import { EventPermissionService } from './services/event-permission.service';
import { EventMasterActionService } from './services/event-master-action.service';
import { CreateEventHandler } from './commands/master/create-event/create-event.handler';
import { UpdateEventHandler } from './commands/master/update-event/update-event.handler';
import { RemoveEventHandler } from './commands/master/remove-event/remove-event.handler';
import { AddEventMembersHandler } from './commands/master/add-event-members/add-event-members.handler';
import { RemoveEventMembersHandler } from './commands/master/remove-event-members/remove-event-members.handler';
import { JoinEventHandler } from './commands/join-event/join-event.handler';
import { CancelJoinEventHandler } from './commands/cancel-join-event/cancel-join-event.handler';
import { PublishEventHandler } from './commands/master/publish-event/publish-event.handler';
import { ArchiveEventHandler } from './commands/master/archive-event/archive-event.handler';
import { UnarchiveEventHandler } from './commands/master/unarchive-event/unarchive-event.handler';
import { CancelEventHandler } from './commands/master/cancel-event/cancel-event.handler';
import { CompleteEventHandler } from './commands/master/complete-event/complete-event.handler';
import { PaginateEventsHandler } from './queries/master/paginate-events/paginate-events.handler';
import { FindOneEventHandler } from './queries/master/find-one-event/find-one-event.handler';
import { PaginateEventMembersHandler } from './queries/master/paginate-event-members/paginate-event-members.handler';
import { PaginateAvailableEventUsersHandler } from './queries/master/paginate-available-event-users/paginate-available-event-users.handler';
import { PaginateEventsHandler as PublicPaginateEventsHandler } from './queries/paginate-events/paginate-events.handler';
import { FindOneEventHandler as PublicFindOneEventHandler } from './queries/find-one-event/find-one-event.handler';
import { PaginateEventMembersHandler as PublicPaginateEventMembersHandler } from './queries/paginate-event-members/paginate-event-members.handler';
import { PaginateUserJoinedEventsHandler } from './queries/paginate-user-joined-events/paginate-user-joined-events.handler';

const commandHandlers = [
  CreateEventHandler,
  UpdateEventHandler,
  RemoveEventHandler,
  AddEventMembersHandler,
  RemoveEventMembersHandler,
  JoinEventHandler,
  CancelJoinEventHandler,
  PublishEventHandler,
  ArchiveEventHandler,
  UnarchiveEventHandler,
  CancelEventHandler,
  CompleteEventHandler,
];
const queryHandlers = [
  PaginateEventsHandler,
  FindOneEventHandler,
  PaginateEventMembersHandler,
  PaginateAvailableEventUsersHandler,
  PublicPaginateEventsHandler,
  PublicFindOneEventHandler,
  PublicPaginateEventMembersHandler,
  PaginateUserJoinedEventsHandler,
];

@Module({
  imports: [
    TypeOrmModule.forFeature([EventEntity, EventMember, File]),
    UserModule,
    CqrsModule,
  ],
  controllers: [EventController, MasterEventController],
  providers: [
    EventRepository,
    EventService,
    EventPermissionService,
    EventMasterActionService,
    ...commandHandlers,
    ...queryHandlers,
  ],
})
export class EventModule {}
