import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StoryComment } from '@entities/main/story/story-comment.entity';
import { PermissionEnum } from '@shared/enums/permission.enum';
import { StoryCommentService } from '../../../services/story-comment.service';
import { StoryPermissionService } from '../../../services/story-permission.service';
import { UnpinStoryCommentCommand } from './unpin-story-comment.command';

@CommandHandler(UnpinStoryCommentCommand)
export class UnpinStoryCommentHandler implements ICommandHandler<UnpinStoryCommentCommand> {
  constructor(
    private readonly storyCommentService: StoryCommentService,
    private readonly storyPermissionService: StoryPermissionService,
    @InjectRepository(StoryComment)
    private readonly storyCommentRepository: Repository<StoryComment>,
  ) {}

  async execute(command: UnpinStoryCommentCommand): Promise<void> {
    const { storyId, commentId, user } = command;

    const story = await this.storyCommentService.findStoryOrFail(storyId);
    this.storyPermissionService.assertCanModify(
      story,
      user,
      PermissionEnum.STORIES_UPDATE,
    );

    const comment = await this.storyCommentService.findCommentOrFail(
      story.id,
      commentId,
    );
    if (!comment.pinnedAt) {
      return;
    }

    await this.storyCommentRepository.update(comment.id, {
      pinnedAt: null,
      pinnedBy: null,
    });
  }
}
