import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StoryComment } from '@entities/main/story/story-comment.entity';
import { UserRepository } from '@modules/Iam/User/repositories/user.repository';
import { StoryCommentService } from '../../../services/story-comment.service';
import { StoryCommentActionService } from '../../../services/story-comment-action.service';
import { CreateStoryCommentCommand } from './create-story-comment.command';

@CommandHandler(CreateStoryCommentCommand)
export class CreateStoryCommentHandler implements ICommandHandler<CreateStoryCommentCommand> {
  constructor(
    private readonly storyCommentService: StoryCommentService,
    private readonly storyCommentActionService: StoryCommentActionService,
    private readonly userRepository: UserRepository,
    @InjectRepository(StoryComment)
    private readonly storyCommentRepository: Repository<StoryComment>,
  ) {}

  async execute(
    command: CreateStoryCommentCommand,
  ): Promise<{ id: string; parentId: string | null }> {
    const { storyId, payload, user } = command;

    await this.userRepository.findAndValidateUserByIds([user.id]);
    const story = await this.storyCommentService.findStoryOrFail(storyId);

    if (!this.storyCommentActionService.isCanComment(story, user)) {
      throw new BadRequestException(
        'Comments can only be added to published or completed stories',
      );
    }

    const parentId = payload.parentId
      ? await this.resolveParentId(story.id, payload.parentId)
      : null;

    const comment = await this.storyCommentRepository.save(
      this.storyCommentRepository.create({
        story: { id: story.id },
        user: { id: user.id },
        parentId,
        content: payload.content,
      }),
    );

    return { id: comment.id, parentId };
  }

  // Returns the top-level comment the reply belongs under. The parent must
  // be a live comment of the same story; anything else is a 404.
  private async resolveParentId(
    storyId: string,
    parentId: string,
  ): Promise<string> {
    const notFound = new NotFoundException(
      `Comment with id ${parentId} not found`,
    );
    const parent = await this.storyCommentRepository.findOne({
      where: { id: parentId, story: { id: storyId } },
    });
    if (!parent) {
      throw notFound;
    }
    if (!parent.parentId) {
      return parent.id;
    }

    // Replies are one level deep: a reply to a reply joins the same thread,
    // which must itself still be live.
    const thread = await this.storyCommentRepository.findOne({
      where: { id: parent.parentId, story: { id: storyId } },
    });
    if (!thread) {
      throw notFound;
    }
    return thread.id;
  }
}
