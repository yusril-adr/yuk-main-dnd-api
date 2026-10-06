import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CqrsModule } from '@nestjs/cqrs';
import { Story } from '@entities/main/story/story.entity';
import { File } from '@entities/main/file.entity';
import { StoryController } from './controllers/story.controller';
import { StoryRepository } from './repositories/story.repository';
import { StoryService } from './services/story.service';
import { StoryPermissionService } from './services/story-permission.service';
import { CreateStoryHandler } from './commands/create-story/create-story.handler';
import { UpdateStoryHandler } from './commands/update-story/update-story.handler';
import { RemoveStoryHandler } from './commands/remove-story/remove-story.handler';
import { ArchiveStoryHandler } from './commands/archive-story/archive-story.handler';
import { UnarchiveStoryHandler } from './commands/unarchive-story/unarchive-story.handler';
import { PaginateStoriesHandler } from './queries/paginate-stories/paginate-stories.handler';
import { FindOneStoryHandler } from './queries/find-one-story/find-one-story.handler';

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
  controllers: [StoryController],
  providers: [
    StoryRepository,
    StoryService,
    StoryPermissionService,
    ...commandHandlers,
    ...queryHandlers,
  ],
})
export class StoryModule {}
