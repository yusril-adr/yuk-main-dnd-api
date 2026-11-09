import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { isUUID } from 'class-validator';
import { Repository } from 'typeorm';
import { StoryComment } from '@entities/main/story/story-comment.entity';
import { StoryCommentReaction } from '@entities/main/story/story-comment-reaction.entity';
import { StorageService } from '@modules/Global/services/storage.service';
import { StoryService } from '../../services/story.service';
import { PaginateStoryCommentReactionsQuery } from './paginate-story-comment-reactions.query';
import { PaginateStoryCommentReactionsOutput } from './paginate-story-comment-reactions.output';

@QueryHandler(PaginateStoryCommentReactionsQuery)
export class PaginateStoryCommentReactionsHandler implements IQueryHandler<
  PaginateStoryCommentReactionsQuery,
  PaginateStoryCommentReactionsOutput
> {
  constructor(
    private readonly storyService: StoryService,
    @InjectRepository(StoryComment)
    private readonly storyCommentRepository: Repository<StoryComment>,
    @InjectRepository(StoryCommentReaction)
    private readonly storyCommentReactionRepository: Repository<StoryCommentReaction>,
    private readonly storageService: StorageService,
  ) {}

  async execute(
    query: PaginateStoryCommentReactionsQuery,
  ): Promise<PaginateStoryCommentReactionsOutput> {
    const { identifier, commentId, params } = query;
    const notFound = new NotFoundException(
      `Comment with id ${commentId} not found`,
    );

    const story = await this.storyService.findPublicByIdentifier(identifier);

    // Soft-deleted comments are excluded by default → 404. Top-level and
    // replies are both allowed (no parentId filter).
    const comment = isUUID(commentId)
      ? await this.storyCommentRepository.findOne({
          where: { id: commentId, story: { id: story.id } },
        })
      : null;
    if (!comment) {
      throw notFound;
    }

    // withDeleted keeps soft-deleted reactors on the row (labeled in output).
    const qb = this.storyCommentReactionRepository
      .createQueryBuilder('reaction')
      .withDeleted()
      .innerJoinAndSelect('reaction.user', 'user')
      // withDeleted above would also load soft-deleted avatar files; keep only live ones
      // (same effective result as member-list find() joins that exclude deleted files).
      .leftJoinAndSelect(
        'user.avatarFile',
        'avatarFile',
        'avatarFile.deleted_at IS NULL',
      )
      .where('reaction.comment_id = :commentId', { commentId: comment.id })
      .orderBy('reaction.createdAt', 'DESC')
      .addOrderBy('reaction.id', 'ASC')
      .take(params.perPage)
      .skip(params.perPage * (params.page - 1));

    if (params.type !== undefined) {
      qb.andWhere('reaction.type = :type', { type: params.type });
    }

    const [reactions, count] = await qb.getManyAndCount();

    const avatarUrls = reactions.map((reaction) =>
      reaction.user.avatarFile
        ? this.storageService.getPublicUrlSync(reaction.user.avatarFile)
        : null,
    );

    return new PaginateStoryCommentReactionsOutput(
      reactions,
      avatarUrls,
      count,
    );
  }
}
