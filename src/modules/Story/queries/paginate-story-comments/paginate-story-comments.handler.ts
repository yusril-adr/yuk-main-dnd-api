import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StoryComment } from '@entities/main/story/story-comment.entity';
import { StorageService } from '@modules/Global/services/storage.service';
import { StoryService } from '../../services/story.service';
import { StoryCommentActionService } from '../../services/story-comment-action.service';
import { StoryCommentReactionService } from '../../services/story-comment-reaction.service';
import { PaginateStoryCommentsQuery } from './paginate-story-comments.query';
import {
  PaginateStoryCommentsOutput,
  TStoryCommentActionList,
} from './paginate-story-comments.output';

@QueryHandler(PaginateStoryCommentsQuery)
export class PaginateStoryCommentsHandler implements IQueryHandler<
  PaginateStoryCommentsQuery,
  PaginateStoryCommentsOutput
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
    query: PaginateStoryCommentsQuery,
  ): Promise<PaginateStoryCommentsOutput> {
    const { identifier, params, user } = query;

    const story = await this.storyService.findPublicByIdentifier(identifier, {
      relations: { createdBy: true },
    });

    // Top-level comments only. Pinned first (newest pin on top), then newest
    // comments, id as tie-break. withDeleted keeps comments from soft-deleted
    // users; a deleted comment stays only as a placeholder while it still has
    // visible replies, so its thread remains readable.
    const [comments, count] = await this.storyCommentRepository
      .createQueryBuilder('comment')
      .withDeleted()
      .innerJoinAndSelect('comment.user', 'user')
      .leftJoinAndSelect('user.avatarFile', 'avatarFile')
      .where('comment.story_id = :storyId', { storyId: story.id })
      .andWhere('comment.parent_id IS NULL')
      .andWhere(
        `(comment.deleted_at IS NULL OR EXISTS (
          SELECT 1 FROM story_comments reply
          WHERE reply.parent_id = comment.id AND reply.deleted_at IS NULL
        ))`,
      )
      .orderBy('comment.pinnedAt', 'DESC', 'NULLS LAST')
      .addOrderBy('comment.createdAt', 'DESC')
      .addOrderBy('comment.id', 'ASC')
      .take(params.perPage)
      .skip(params.perPage * (params.page - 1))
      .getManyAndCount();

    const avatarUrls = comments.map((comment) =>
      comment.user.avatarFile && !comment.deletedAt
        ? this.storageService.getPublicUrlSync(comment.user.avatarFile)
        : null,
    );
    const replyCounts = await this.countReplies(
      comments.map((comment) => comment.id),
    );

    // Permissions come from the caller's token, so no per-comment lookups.
    const actionLists: TStoryCommentActionList[] = comments.map((comment) => ({
      isCanUpdate: this.storyCommentActionService.isCanUpdate(comment, user),
      isCanDelete: this.storyCommentActionService.isCanDelete(
        comment,
        story,
        user,
      ),
      isCanPin: this.storyCommentActionService.isCanPin(comment, story, user),
      isCanUnpin: this.storyCommentActionService.isCanUnpin(
        comment,
        story,
        user,
      ),
      isCanReact: this.storyCommentActionService.isCanReact(
        comment,
        story,
        user,
      ),
    }));

    const reactions = await this.storyCommentReactionService.getSummaries(
      comments,
      user,
    );

    return new PaginateStoryCommentsOutput(
      comments,
      avatarUrls,
      actionLists,
      comments.map((comment) => replyCounts.get(comment.id) ?? 0),
      reactions,
      count,
    );
  }

  // One grouped query for the whole page.
  private async countReplies(
    parentIds: string[],
  ): Promise<Map<string, number>> {
    if (parentIds.length === 0) {
      return new Map();
    }
    const rows = await this.storyCommentRepository
      .createQueryBuilder('reply')
      .select('reply.parent_id', 'parentId')
      .addSelect('COUNT(*)::int', 'count')
      .where('reply.parent_id IN (:...parentIds)', { parentIds })
      .andWhere('reply.deleted_at IS NULL')
      .groupBy('reply.parent_id')
      .getRawMany<{ parentId: string; count: number }>();
    return new Map(rows.map((row) => [row.parentId, Number(row.count)]));
  }
}
