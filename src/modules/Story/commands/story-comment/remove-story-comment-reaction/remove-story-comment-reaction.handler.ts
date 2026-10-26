import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StoryCommentReaction } from '@entities/main/story/story-comment-reaction.entity';
import { StoryCommentService } from '../../../services/story-comment.service';
import { RemoveStoryCommentReactionCommand } from './remove-story-comment-reaction.command';

@CommandHandler(RemoveStoryCommentReactionCommand)
export class RemoveStoryCommentReactionHandler implements ICommandHandler<RemoveStoryCommentReactionCommand> {
  constructor(
    private readonly storyCommentService: StoryCommentService,
    @InjectRepository(StoryCommentReaction)
    private readonly storyCommentReactionRepository: Repository<StoryCommentReaction>,
  ) {}

  // Idempotent: removing a reaction that isn't there is still a success.
  // No story status check, so a reaction can always be taken back.
  async execute(command: RemoveStoryCommentReactionCommand): Promise<void> {
    const { storyId, commentId, user } = command;

    const story = await this.storyCommentService.findStoryOrFail(storyId);
    const comment = await this.storyCommentService.findCommentOrFail(
      story.id,
      commentId,
    );

    await this.storyCommentReactionRepository.delete({
      comment: { id: comment.id },
      user: { id: user.id },
    });
  }
}
