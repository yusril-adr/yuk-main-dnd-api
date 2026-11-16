import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CqrsModule } from '@nestjs/cqrs';
import { EventEntity } from '@entities/main/event/event.entity';
import { EventMember } from '@entities/main/event/event-member.entity';
import { File } from '@entities/main/file.entity';
import { EventComment } from '@entities/main/event/event-comment.entity';
import { EventCommentReaction } from '@entities/main/event/event-comment-reaction.entity';
import { UserModule } from '@modules/Iam/User/user.module';
import { BoardEventController } from './controllers/board-event.controller';
import { EventController } from './controllers/event.controller';
import { MasterEventController } from './controllers/master-event.controller';
import { EventCommentController } from './controllers/event-comment.controller';
import { EventRepository } from './repositories/event.repository';
import { EventService } from './services/event.service';
import { EventPermissionService } from './services/event-permission.service';
import { EventMasterActionService } from './services/event-master-action.service';
import { EventCommentService } from './services/event-comment.service';
import { EventCommentConfigService } from './services/event-comment-config.service';
import { EventCommentActionService } from './services/event-comment-action.service';
import { EventCommentReactionService } from './services/event-comment-reaction.service';
import { CreateEventCommentHandler } from './commands/event-comment/create-event-comment/create-event-comment.handler';
import { UpdateEventCommentHandler } from './commands/event-comment/update-event-comment/update-event-comment.handler';
import { RemoveEventCommentHandler } from './commands/event-comment/remove-event-comment/remove-event-comment.handler';
import { PinEventCommentHandler } from './commands/event-comment/pin-event-comment/pin-event-comment.handler';
import { UnpinEventCommentHandler } from './commands/event-comment/unpin-event-comment/unpin-event-comment.handler';
import { SetEventCommentReactionHandler } from './commands/event-comment/set-event-comment-reaction/set-event-comment-reaction.handler';
import { RemoveEventCommentReactionHandler } from './commands/event-comment/remove-event-comment-reaction/remove-event-comment-reaction.handler';
import { PaginateEventCommentsHandler } from './queries/paginate-event-comments/paginate-event-comments.handler';
import { PaginateEventCommentRepliesHandler } from './queries/paginate-event-comment-replies/paginate-event-comment-replies.handler';
import { PaginateEventCommentReactionsHandler } from './queries/paginate-event-comment-reactions/paginate-event-comment-reactions.handler';
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
import { PaginateEventsHandler as BoardPaginateEventsHandler } from './queries/board/paginate-events/paginate-events.handler';
import { FindOneEventHandler as BoardFindOneEventHandler } from './queries/board/find-one-event/find-one-event.handler';
import { PaginateEventMembersHandler as BoardPaginateEventMembersHandler } from './queries/board/paginate-event-members/paginate-event-members.handler';

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
  CreateEventCommentHandler,
  UpdateEventCommentHandler,
  RemoveEventCommentHandler,
  PinEventCommentHandler,
  UnpinEventCommentHandler,
  SetEventCommentReactionHandler,
  RemoveEventCommentReactionHandler,
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
  BoardPaginateEventsHandler,
  BoardFindOneEventHandler,
  BoardPaginateEventMembersHandler,
  PaginateEventCommentsHandler,
  PaginateEventCommentRepliesHandler,
  PaginateEventCommentReactionsHandler,
];

@Module({
  imports: [
    TypeOrmModule.forFeature([
      EventEntity,
      EventMember,
      File,
      EventComment,
      EventCommentReaction,
    ]),
    UserModule,
    CqrsModule,
  ],
  controllers: [
    EventController,
    EventCommentController,
    MasterEventController,
    BoardEventController,
  ],
  providers: [
    EventRepository,
    EventService,
    EventPermissionService,
    EventMasterActionService,
    EventCommentService,
    EventCommentConfigService,
    EventCommentActionService,
    EventCommentReactionService,
    ...commandHandlers,
    ...queryHandlers,
  ],
  exports: [EventRepository, EventService],
})
export class EventModule {}
