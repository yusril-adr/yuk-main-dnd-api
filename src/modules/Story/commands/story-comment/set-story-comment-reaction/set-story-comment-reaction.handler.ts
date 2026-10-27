import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StoryCommentReaction } from '@entities/main/story/story-comment-reaction.entity';
import { UserRepository } from '@modules/Iam/User/repositories/user.repository';
import { StoryCommentService } from '../../../services/story-comment.service';
import { StoryCommentActionService } from '../../../services/story-comment-action.service';
import { SetStoryCommentReactionCommand } from './set-story-comment-reaction.command';

@CommandHandler(SetStoryCommentReactionCommand)
export class SetStoryCommentReactionHandler implements ICommandHandler<SetStoryCommentReactionCommand> {
  constructor(
    private readonly storyCommentService: StoryCommentService,
    private readonly storyCommentActionService: StoryCommentActionService,
    private readonly userRepository: UserRepository,
    @InjectRepository(StoryCommentReaction)
    private readonly storyCommentReactionRepository: Repository<StoryCommentReaction>,
  ) {}

  async execute(command: SetStoryCommentReactionCommand): Promise<void> {
    const { storyId, commentId, payload, user } = command;

    await this.userRepository.findAndValidateUserByIds([user.id]);
    const story = await this.storyCommentService.findStoryOrFail(storyId);
    const comment = await this.storyCommentService.findCommentOrFail(
      story.id,
      commentId,
    );

    if (!this.storyCommentActionService.isCanReact(comment, story, user)) {
      throw new BadRequestException(
        'Reactions can only be added on published or completed stories',
      );
    }

    // One reaction per user per comment: insert, or switch the type. Sending
    // the same type again changes nothing.
    await this.storyCommentReactionRepository
      .createQueryBuilder()
      .insert()
      .into(StoryCommentReaction)
      .values({
        comment: { id: comment.id },
        user: { id: user.id },
        type: payload.type,
      })
      .orUpdate(['type', 'updated_at'], ['comment_id', 'user_id'], {
        skipUpdateIfNoValuesChanged: true,
      })
      .execute();
  }
}
