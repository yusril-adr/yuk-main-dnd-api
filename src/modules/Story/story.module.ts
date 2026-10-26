import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CqrsModule } from '@nestjs/cqrs';
import { Story } from '@entities/main/story/story.entity';
import { File } from '@entities/main/file.entity';
import { StoryMember } from '@entities/main/story/story-member.entity';
import { StoryComment } from '@entities/main/story/story-comment.entity';
import { UserModule } from '@modules/Iam/User/user.module';
import { BoardStoryController } from './controllers/board-story.controller';
import { MasterStoryController } from './controllers/master-story.controller';
import { StoryController } from './controllers/story.controller';
import { StoryCommentController } from './controllers/story-comment.controller';
import { StoryRepository } from './repositories/story.repository';
import { StoryService } from './services/story.service';
import { StoryPermissionService } from './services/story-permission.service';
import { StoryMasterActionService } from './services/story-master-action.service';
import { StoryCommentService } from './services/story-comment.service';
import { StoryCommentConfigService } from './services/story-comment-config.service';
import { StoryCommentActionService } from './services/story-comment-action.service';
import { CreateStoryHandler } from './commands/master/create-story/create-story.handler';
import { UpdateStoryHandler } from './commands/master/update-story/update-story.handler';
import { AddStoryMembersHandler } from './commands/master/add-story-members/add-story-members.handler';
import { RemoveStoryMembersHandler } from './commands/master/remove-story-members/remove-story-members.handler';
import { RemoveStoryHandler } from './commands/master/remove-story/remove-story.handler';
import { ArchiveStoryHandler } from './commands/master/archive-story/archive-story.handler';
import { PublishStoryHandler } from './commands/master/publish-story/publish-story.handler';
import { UnarchiveStoryHandler } from './commands/master/unarchive-story/unarchive-story.handler';
import { CancelStoryHandler } from './commands/master/cancel-story/cancel-story.handler';
import { CompleteStoryHandler } from './commands/master/complete-story/complete-story.handler';
import { JoinStoryHandler } from './commands/join-story/join-story.handler';
import { CancelJoinStoryHandler } from './commands/cancel-join-story/cancel-join-story.handler';
import { PaginateStoriesHandler } from './queries/master/paginate-stories/paginate-stories.handler';
import { PaginateStoriesHandler as PublicPaginateStoriesHandler } from './queries/paginate-stories/paginate-stories.handler';
import { PaginateUserStoriesHandler } from './queries/paginate-user-stories/paginate-user-stories.handler';
import { PaginateUserJoinedStoriesHandler } from './queries/paginate-user-joined-stories/paginate-user-joined-stories.handler';
import { PaginateStoriesHandler as BoardPaginateStoriesHandler } from './queries/board/paginate-stories/paginate-stories.handler';
import { FindOneStoryHandler } from './queries/master/find-one-story/find-one-story.handler';
import { FindOneStoryHandler as PublicFindOneStoryHandler } from './queries/find-one-story/find-one-story.handler';
import { FindOneStoryHandler as BoardFindOneStoryHandler } from './queries/board/find-one-story/find-one-story.handler';
import { PaginateStoryMembersHandler } from './queries/master/paginate-story-members/paginate-story-members.handler';
import { PaginateStoryMembersHandler as BoardPaginateStoryMembersHandler } from './queries/board/paginate-story-members/paginate-story-members.handler';
import { PaginateStoryMembersHandler as PublicPaginateStoryMembersHandler } from './queries/paginate-story-members/paginate-story-members.handler';
import { CreateStoryCommentHandler } from './commands/story-comment/create-story-comment/create-story-comment.handler';
import { UpdateStoryCommentHandler } from './commands/story-comment/update-story-comment/update-story-comment.handler';
import { RemoveStoryCommentHandler } from './commands/story-comment/remove-story-comment/remove-story-comment.handler';
import { PinStoryCommentHandler } from './commands/story-comment/pin-story-comment/pin-story-comment.handler';
import { UnpinStoryCommentHandler } from './commands/story-comment/unpin-story-comment/unpin-story-comment.handler';
import { PaginateStoryCommentsHandler } from './queries/paginate-story-comments/paginate-story-comments.handler';
import { PaginateStoryCommentRepliesHandler } from './queries/paginate-story-comment-replies/paginate-story-comment-replies.handler';
import { PaginateAvailableStoryUsersHandler } from './queries/master/paginate-available-story-users/paginate-available-story-users.handler';

const commandHandlers = [
  CreateStoryHandler,
  UpdateStoryHandler,
  AddStoryMembersHandler,
  RemoveStoryMembersHandler,
  RemoveStoryHandler,
  ArchiveStoryHandler,
  UnarchiveStoryHandler,
  PublishStoryHandler,
  CancelStoryHandler,
  CompleteStoryHandler,
  JoinStoryHandler,
  CancelJoinStoryHandler,
  CreateStoryCommentHandler,
  UpdateStoryCommentHandler,
  RemoveStoryCommentHandler,
  PinStoryCommentHandler,
  UnpinStoryCommentHandler,
];
const queryHandlers = [
  PaginateStoriesHandler,
  FindOneStoryHandler,
  PaginateStoryMembersHandler,
  PaginateAvailableStoryUsersHandler,
  PublicPaginateStoriesHandler,
  PaginateUserStoriesHandler,
  PaginateUserJoinedStoriesHandler,
  PublicFindOneStoryHandler,
  PublicPaginateStoryMembersHandler,
  BoardPaginateStoriesHandler,
  BoardFindOneStoryHandler,
  BoardPaginateStoryMembersHandler,
  PaginateStoryCommentsHandler,
  PaginateStoryCommentRepliesHandler,
];

@Module({
  imports: [
    TypeOrmModule.forFeature([Story, File, StoryMember, StoryComment]),
    UserModule,
    CqrsModule,
  ],
  controllers: [
    MasterStoryController,
    StoryController,
    StoryCommentController,
    BoardStoryController,
  ],
  providers: [
    StoryRepository,
    StoryService,
    StoryPermissionService,
    StoryMasterActionService,
    StoryCommentService,
    StoryCommentConfigService,
    StoryCommentActionService,
    ...commandHandlers,
    ...queryHandlers,
  ],
})
export class StoryModule {}
