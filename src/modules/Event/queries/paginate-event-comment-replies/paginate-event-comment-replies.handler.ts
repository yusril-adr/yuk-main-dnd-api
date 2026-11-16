import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { isUUID } from 'class-validator';
import { IsNull, Repository } from 'typeorm';
import { EventComment } from '@entities/main/event/event-comment.entity';
import { StorageService } from '@modules/Global/services/storage.service';
import { EventService } from '../../services/event.service';
import { EventCommentActionService } from '../../services/event-comment-action.service';
import { EventCommentReactionService } from '../../services/event-comment-reaction.service';
import type { TEventCommentActionList } from '../../types/event-comment-action-list.type';
import { PaginateEventCommentRepliesQuery } from './paginate-event-comment-replies.query';
import { PaginateEventCommentRepliesOutput } from './paginate-event-comment-replies.output';

@QueryHandler(PaginateEventCommentRepliesQuery)
export class PaginateEventCommentRepliesHandler implements IQueryHandler<
  PaginateEventCommentRepliesQuery,
  PaginateEventCommentRepliesOutput
> {
  constructor(
    private readonly eventService: EventService,
    @InjectRepository(EventComment)
    private readonly eventCommentRepository: Repository<EventComment>,
    private readonly storageService: StorageService,
    private readonly eventCommentActionService: EventCommentActionService,
    private readonly eventCommentReactionService: EventCommentReactionService,
  ) {}

  async execute(
    query: PaginateEventCommentRepliesQuery,
  ): Promise<PaginateEventCommentRepliesOutput> {
    const { identifier, commentId, params, user } = query;
    const notFound = new NotFoundException(
      `Comment with id ${commentId} not found`,
    );

    const event = await this.eventService.findPublicByIdentifier(identifier, {
      relations: { createdBy: true },
    });

    // Only top-level comments have replies. A deleted parent is still
    // readable while it has visible replies (checked after the count).
    const parent = isUUID(commentId)
      ? await this.eventCommentRepository.findOne({
          where: { id: commentId, event: { id: event.id }, parentId: IsNull() },
          withDeleted: true,
        })
      : null;
    if (!parent) {
      throw notFound;
    }

    // Oldest first so a thread reads top to bottom. withDeleted keeps replies
    // from soft-deleted users; deleted replies are filtered out explicitly.
    const [replies, count] = await this.eventCommentRepository
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

    const actionLists: TEventCommentActionList[] = replies.map((reply) => ({
      isCanUpdate: this.eventCommentActionService.isCanUpdate(reply, user),
      isCanDelete: this.eventCommentActionService.isCanDelete(
        reply,
        event,
        user,
      ),
      isCanPin: this.eventCommentActionService.isCanPin(reply, event, user),
      isCanUnpin: this.eventCommentActionService.isCanUnpin(reply, event, user),
      isCanReact: this.eventCommentActionService.isCanReact(reply, event, user),
    }));

    const reactions = await this.eventCommentReactionService.getSummaries(
      replies,
      user,
    );

    return new PaginateEventCommentRepliesOutput(
      replies,
      avatarUrls,
      actionLists,
      reactions,
      count,
    );
  }
}
