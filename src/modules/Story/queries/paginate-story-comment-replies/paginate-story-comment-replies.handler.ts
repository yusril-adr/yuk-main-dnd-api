import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { isUUID } from 'class-validator';
import { IsNull, Repository } from 'typeorm';
import { StoryComment } from '@entities/main/story/story-comment.entity';
import { StorageService } from '@modules/Global/services/storage.service';
import { StoryService } from '../../services/story.service';
import { StoryCommentActionService } from '../../services/story-comment-action.service';
import { StoryCommentReactionService } from '../../services/story-comment-reaction.service';
import type { TStoryCommentActionList } from '../paginate-story-comments/paginate-story-comments.output';
import { PaginateStoryCommentRepliesQuery } from './paginate-story-comment-replies.query';
import { PaginateStoryCommentRepliesOutput } from './paginate-story-comment-replies.output';

@QueryHandler(PaginateStoryCommentRepliesQuery)
export class PaginateStoryCommentRepliesHandler implements IQueryHandler<
  PaginateStoryCommentRepliesQuery,
  PaginateStoryCommentRepliesOutput
> {
  constructor(
    private readonly storyService: StoryService,
    @InjectRepository(StoryComment)
    private readonly storyCommentRepository: Repository<StoryComment>,
    private readonly storageService: StorageService,
    private readonly storyCommentActionService: StoryCommentActionService,
    private readonly storyCommentReactionService: StoryCommentReactionService,
  ) {}

  async execute(
    query: PaginateStoryCommentRepliesQuery,
  ): Promise<PaginateStoryCommentRepliesOutput> {
    const { identifier, commentId, params, user } = query;
    const notFound = new NotFoundException(
      `Comment with id ${commentId} not found`,
    );

    const story = await this.storyService.findPublicByIdentifier(identifier, {
      relations: { createdBy: true },
    });

    // Only top-level comments have replies. A deleted parent is still
    // readable while it has visible replies (checked after the count).
    const parent = isUUID(commentId)
      ? await this.storyCommentRepository.findOne({
          where: { id: commentId, story: { id: story.id }, parentId: IsNull() },
          withDeleted: true,
        })
      : null;
    if (!parent) {
      throw notFound;
    }

    // Oldest first so a thread reads top to bottom. withDeleted keeps replies
    // from soft-deleted users; deleted replies are filtered out explicitly.
    const [replies, count] = await this.storyCommentRepository
      .createQueryBuilder('reply')
      .withDeleted()
      .innerJoinAndSelect('reply.user', 'user')
      .leftJoinAndSelect('user.avatarFile', 'avatarFile')
      .where('reply.parent_id = :parentId', { parentId: parent.id })
      .andWhere('reply.deleted_at IS NULL')
      .orderBy('reply.createdAt', 'ASC')
      .addOrderBy('reply.id', 'ASC')
      .take(params.perPage)
      .skip(params.perPage * (params.page - 1))
      .getManyAndCount();

    if (parent.deletedAt && count === 0) {
      throw notFound;
    }

    const avatarUrls = replies.map((reply) =>
      reply.user.avatarFile
        ? this.storageService.getPublicUrlSync(reply.user.avatarFile)
        : null,
    );

    const actionLists: TStoryCommentActionList[] = replies.map((reply) => ({
      isCanUpdate: this.storyCommentActionService.isCanUpdate(reply, user),
      isCanDelete: this.storyCommentActionService.isCanDelete(
        reply,
        story,
        user,
      ),
      isCanPin: this.storyCommentActionService.isCanPin(reply, story, user),
      isCanUnpin: this.storyCommentActionService.isCanUnpin(reply, story, user),
      isCanReact: this.storyCommentActionService.isCanReact(reply, story, user),
    }));

    const reactions = await this.storyCommentReactionService.getSummaries(
      replies,
      user,
    );

    return new PaginateStoryCommentRepliesOutput(
      replies,
      avatarUrls,
      actionLists,
      reactions,
      count,
    );
  }
}
