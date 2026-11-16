import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventComment } from '@entities/main/event/event-comment.entity';
import { StorageService } from '@modules/Global/services/storage.service';
import { EventService } from '../../services/event.service';
import { EventCommentActionService } from '../../services/event-comment-action.service';
import { PaginateEventCommentsQuery } from './paginate-event-comments.query';
import { PaginateEventCommentsOutput } from './paginate-event-comments.output';
import type { TEventCommentActionList } from '../../types/event-comment-action-list.type';

@QueryHandler(PaginateEventCommentsQuery)
export class PaginateEventCommentsHandler implements IQueryHandler<
  PaginateEventCommentsQuery,
  PaginateEventCommentsOutput
> {
  constructor(
    private readonly eventService: EventService,
    @InjectRepository(EventComment)
    private readonly eventCommentRepository: Repository<EventComment>,
    private readonly storageService: StorageService,
    private readonly eventCommentActionService: EventCommentActionService,
  ) {}

  async execute(
    query: PaginateEventCommentsQuery,
  ): Promise<PaginateEventCommentsOutput> {
    const { identifier, params, user } = query;

    const event = await this.eventService.findPublicByIdentifier(identifier, {
      relations: { createdBy: true },
    });

    // Top-level comments only. Pinned first (newest pin on top), then newest
    // comments, id as tie-break. withDeleted keeps comments from soft-deleted
    // users; a deleted comment stays only as a placeholder while it still has
    // visible replies, so its thread remains readable.
    const [comments, count] = await this.eventCommentRepository
      .createQueryBuilder('comment')
      .withDeleted()
      .innerJoinAndSelect('comment.user', 'user')
      .leftJoinAndSelect('user.avatarFile', 'avatarFile')
      .where('comment.event_id = :eventId', { eventId: event.id })
      .andWhere('comment.parent_id IS NULL')
      .andWhere(
        `(comment.deleted_at IS NULL OR EXISTS (
          SELECT 1 FROM event_comments reply
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
    const actionLists: TEventCommentActionList[] = comments.map((comment) => ({
      isCanUpdate: this.eventCommentActionService.isCanUpdate(comment, user),
      isCanDelete: this.eventCommentActionService.isCanDelete(
        comment,
        event,
        user,
      ),
      isCanPin: this.eventCommentActionService.isCanPin(comment, event, user),
      isCanUnpin: this.eventCommentActionService.isCanUnpin(
        comment,
        event,
        user,
      ),
    }));

    return new PaginateEventCommentsOutput(
      comments,
      avatarUrls,
      actionLists,
      comments.map((comment) => replyCounts.get(comment.id) ?? 0),
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
    const rows = await this.eventCommentRepository
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
