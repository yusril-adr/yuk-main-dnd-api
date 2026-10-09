import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CqrsModule } from '@nestjs/cqrs';
import { Story } from '@entities/main/story/story.entity';
import { File } from '@entities/main/file.entity';
import { StoryMember } from '@entities/main/story/story-member.entity';
import { UserModule } from '@modules/Iam/User/user.module';
import { MasterStoryController } from './controllers/master-story.controller';
import { StoryRepository } from './repositories/story.repository';
import { StoryService } from './services/story.service';
import { StoryPermissionService } from './services/story-permission.service';
import { CreateStoryHandler } from './commands/master/create-story/create-story.handler';
import { UpdateStoryHandler } from './commands/master/update-story/update-story.handler';
import { AddStoryMembersHandler } from './commands/master/add-story-members/add-story-members.handler';
import { RemoveStoryMembersHandler } from './commands/master/remove-story-members/remove-story-members.handler';
import { RemoveStoryHandler } from './commands/master/remove-story/remove-story.handler';
import { ArchiveStoryHandler } from './commands/master/archive-story/archive-story.handler';
import { PublishStoryHandler } from './commands/master/publish-story/publish-story.handler';
import { UnarchiveStoryHandler } from './commands/master/unarchive-story/unarchive-story.handler';
import { PaginateStoriesHandler } from './queries/master/paginate-stories/paginate-stories.handler';
import { FindOneStoryHandler } from './queries/master/find-one-story/find-one-story.handler';
import { GetStoryMembersHandler } from './queries/master/get-story-members/get-story-members.handler';
import { GetAvailableStoryUsersHandler } from './queries/master/get-available-story-users/get-available-story-users.handler';

const commandHandlers = [
  CreateStoryHandler,
  UpdateStoryHandler,
  AddStoryMembersHandler,
  RemoveStoryMembersHandler,
  RemoveStoryHandler,
  ArchiveStoryHandler,
  UnarchiveStoryHandler,
  PublishStoryHandler,
];
const queryHandlers = [
  PaginateStoriesHandler,
  FindOneStoryHandler,
  GetStoryMembersHandler,
  GetAvailableStoryUsersHandler,
];

@Module({
  imports: [
    TypeOrmModule.forFeature([Story, File, StoryMember]),
    UserModule,
    CqrsModule,
  ],
  controllers: [MasterStoryController],
  providers: [
    StoryRepository,
    StoryService,
    StoryPermissionService,
    ...commandHandlers,
    ...queryHandlers,
  ],
})
export class StoryModule {}
