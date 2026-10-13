import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CqrsModule } from '@nestjs/cqrs';
import { Story } from '@entities/main/story/story.entity';
import { File } from '@entities/main/file.entity';
import { StoryMember } from '@entities/main/story/story-member.entity';
import { UserModule } from '@modules/Iam/User/user.module';
import { BoardStoryController } from './controllers/board-story.controller';
import { MasterStoryController } from './controllers/master-story.controller';
import { StoryController } from './controllers/story.controller';
import { StoryRepository } from './repositories/story.repository';
import { StoryService } from './services/story.service';
import { StoryPermissionService } from './services/story-permission.service';
import { StoryMasterActionService } from './services/story-master-action.service';
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
import { PaginateStoriesHandler as BoardPaginateStoriesHandler } from './queries/board/paginate-stories/paginate-stories.handler';
import { FindOneStoryHandler } from './queries/master/find-one-story/find-one-story.handler';
import { FindOneStoryHandler as PublicFindOneStoryHandler } from './queries/find-one-story/find-one-story.handler';
import { PaginateStoryMembersHandler } from './queries/master/paginate-story-members/paginate-story-members.handler';
import { PaginateStoryMembersHandler as PublicPaginateStoryMembersHandler } from './queries/paginate-story-members/paginate-story-members.handler';
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
];
const queryHandlers = [
  PaginateStoriesHandler,
  FindOneStoryHandler,
  PaginateStoryMembersHandler,
  PaginateAvailableStoryUsersHandler,
  PublicPaginateStoriesHandler,
  PublicFindOneStoryHandler,
  PublicPaginateStoryMembersHandler,
  BoardPaginateStoriesHandler,
];

@Module({
  imports: [
    TypeOrmModule.forFeature([Story, File, StoryMember]),
    UserModule,
    CqrsModule,
  ],
  controllers: [MasterStoryController, StoryController, BoardStoryController],
  providers: [
    StoryRepository,
    StoryService,
    StoryPermissionService,
    StoryMasterActionService,
    ...commandHandlers,
    ...queryHandlers,
  ],
})
export class StoryModule {}
