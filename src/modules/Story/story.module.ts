import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CqrsModule } from '@nestjs/cqrs';
import { Story } from '@entities/main/story/story.entity';
import { File } from '@entities/main/file.entity';
import { MasterStoryController } from './controllers/master-story.controller';
import { StoryRepository } from './repositories/story.repository';
import { StoryService } from './services/story.service';
import { StoryPermissionService } from './services/story-permission.service';
import { CreateStoryHandler } from './commands/master/create-story/create-story.handler';
import { UpdateStoryHandler } from './commands/master/update-story/update-story.handler';
import { RemoveStoryHandler } from './commands/master/remove-story/remove-story.handler';
import { ArchiveStoryHandler } from './commands/master/archive-story/archive-story.handler';
import { UnarchiveStoryHandler } from './commands/master/unarchive-story/unarchive-story.handler';
import { PaginateStoriesHandler } from './queries/master/paginate-stories/paginate-stories.handler';
import { FindOneStoryHandler } from './queries/master/find-one-story/find-one-story.handler';

const commandHandlers = [
  CreateStoryHandler,
  UpdateStoryHandler,
  RemoveStoryHandler,
  ArchiveStoryHandler,
  UnarchiveStoryHandler,
];
const queryHandlers = [PaginateStoriesHandler, FindOneStoryHandler];

@Module({
  imports: [TypeOrmModule.forFeature([Story, File]), CqrsModule],
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
