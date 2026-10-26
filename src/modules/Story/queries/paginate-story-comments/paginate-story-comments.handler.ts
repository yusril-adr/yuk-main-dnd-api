import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StoryComment } from '@entities/main/story/story-comment.entity';
import { StorageService } from '@modules/Global/services/storage.service';
import { StoryService } from '../../services/story.service';
import { StoryCommentActionService } from '../../services/story-comment-action.service';
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
  ) {}

  async execute(
    query: PaginateStoryCommentsQuery,
  ): Promise<PaginateStoryCommentsOutput> {
    const { identifier, params, user } = query;

    const story = await this.storyService.findPublicByIdentifier(identifier, {
      relations: { createdBy: true },
    });

    // Pinned first (newest pin on top), then newest comments, id as tie-break.
    // withDeleted keeps comments from soft-deleted users; deleted comments are
    // filtered out explicitly below.
    const [comments, count] = await this.storyCommentRepository
      .createQueryBuilder('comment')
      .withDeleted()
      .innerJoinAndSelect('comment.user', 'user')
      .leftJoinAndSelect('user.avatarFile', 'avatarFile')
      .where('comment.story_id = :storyId', { storyId: story.id })
      .andWhere('comment.deleted_at IS NULL')
      .orderBy('comment.pinnedAt', 'DESC', 'NULLS LAST')
      .addOrderBy('comment.createdAt', 'DESC')
      .addOrderBy('comment.id', 'ASC')
      .take(params.perPage)
      .skip(params.perPage * (params.page - 1))
      .getManyAndCount();

    const avatarUrls = comments.map((comment) =>
      comment.user.avatarFile
        ? this.storageService.getPublicUrlSync(comment.user.avatarFile)
        : null,
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
    }));

    return new PaginateStoryCommentsOutput(
      comments,
      avatarUrls,
      actionLists,
      count,
    );
  }
}
