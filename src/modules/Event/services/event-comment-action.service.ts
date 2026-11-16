import { Injectable } from '@nestjs/common';
import { EventEntity as Event } from '@entities/main/event/event.entity';
import { EventComment } from '@entities/main/event/event-comment.entity';
import { PermissionEnum } from '@shared/enums/permission.enum';
import type { TJWTPayload } from '@shared/types/jwt-payload.type';
import { PUBLIC_EVENT_STATUSES } from '../enums/event-status.enum';
import { EventPermissionService } from './event-permission.service';

@Injectable()
export class EventCommentActionService {
  constructor(
    private readonly eventPermissionService: EventPermissionService,
  ) {}

  // Comments are listed on the public event page, so only events that page
  // shows (published or completed) accept new comments.
  isCanComment(event: Event, user: TJWTPayload | null): boolean {
    return user !== null && PUBLIC_EVENT_STATUSES.includes(event.status);
  }

  isCanUpdate(comment: EventComment, user: TJWTPayload | null): boolean {
    return (
      user !== null && comment.deletedAt == null && comment.user?.id === user.id
    );
  }

  isCanDelete(
    comment: EventComment,
    event: Event,
    user: TJWTPayload | null,
  ): boolean {
    if (user === null || comment.deletedAt != null) {
      return false;
    }
    return (
      comment.user?.id === user.id ||
      this.eventPermissionService.canModify(
        event,
        user,
        PermissionEnum.EVENTS_DELETE,
      )
    );
  }

  // Permission only. The pin and unpin handlers use this for their 403, so
  // both stay idempotent regardless of pinned state.
  hasPinPermission(event: Event, user: TJWTPayload | null): boolean {
    return (
      user !== null &&
      this.eventPermissionService.canModify(
        event,
        user,
        PermissionEnum.EVENTS_UPDATE,
      )
    );
  }

  // Only live top-level comments can be pinned; replies never can.
  isCanManagePin(
    comment: EventComment,
    event: Event,
    user: TJWTPayload | null,
  ): boolean {
    return (
      comment.parentId == null &&
      comment.deletedAt == null &&
      this.hasPinPermission(event, user)
    );
  }

  isCanPin(
    comment: EventComment,
    event: Event,
    user: TJWTPayload | null,
  ): boolean {
    return (
      comment.pinnedAt == null && this.isCanManagePin(comment, event, user)
    );
  }

  isCanUnpin(
    comment: EventComment,
    event: Event,
    user: TJWTPayload | null,
  ): boolean {
    return (
      comment.pinnedAt != null && this.isCanManagePin(comment, event, user)
    );
  }
}
