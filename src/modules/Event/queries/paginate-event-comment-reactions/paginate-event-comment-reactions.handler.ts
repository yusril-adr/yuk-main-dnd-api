import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { isUUID } from 'class-validator';
import { Repository } from 'typeorm';
import { EventComment } from '@entities/main/event/event-comment.entity';
import { EventCommentReaction } from '@entities/main/event/event-comment-reaction.entity';
import { StorageService } from '@modules/Global/services/storage.service';
import { EventService } from '../../services/event.service';
import { PaginateEventCommentReactionsQuery } from './paginate-event-comment-reactions.query';
import { PaginateEventCommentReactionsOutput } from './paginate-event-comment-reactions.output';

@QueryHandler(PaginateEventCommentReactionsQuery)
export class PaginateEventCommentReactionsHandler implements IQueryHandler<
  PaginateEventCommentReactionsQuery,
  PaginateEventCommentReactionsOutput
> {
  constructor(
    private readonly eventService: EventService,
    @InjectRepository(EventComment)
    private readonly eventCommentRepository: Repository<EventComment>,
    @InjectRepository(EventCommentReaction)
    private readonly eventCommentReactionRepository: Repository<EventCommentReaction>,
    private readonly storageService: StorageService,
  ) {}

  async execute(
    query: PaginateEventCommentReactionsQuery,
  ): Promise<PaginateEventCommentReactionsOutput> {
    const { identifier, commentId, params } = query;
    const notFound = new NotFoundException(
      `Comment with id ${commentId} not found`,
    );

    const event = await this.eventService.findPublicByIdentifier(identifier);

    // Soft-deleted comments are excluded by default → 404. Top-level and
    // replies are both allowed (no parentId filter).
    const comment = isUUID(commentId)
      ? await this.eventCommentRepository.findOne({
          where: { id: commentId, event: { id: event.id } },
        })
      : null;
    if (!comment) {
      throw notFound;
    }

    // withDeleted keeps soft-deleted reactors on the row (labeled in output).
    const qb = this.eventCommentReactionRepository
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

    return new PaginateEventCommentReactionsOutput(
      reactions,
      avatarUrls,
      count,
    );
  }
}
