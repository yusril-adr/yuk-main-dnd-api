import { Injectable } from '@nestjs/common';
import { EventEntity } from '@entities/main/event/event.entity';
import { PermissionEnum } from '@shared/enums/permission.enum';
import type { TJWTPayload } from '@shared/types/jwt-payload.type';
import { EventStatusEnum } from '../enums/event-status.enum';
import { EventPermissionService } from './event-permission.service';
import { EventService } from './event.service';

@Injectable()
export class EventMasterActionService {
  constructor(
    private readonly permissionService: EventPermissionService,
    private readonly eventService: EventService,
  ) {}
  isCanCreate(user: TJWTPayload): boolean {
    return user.permissions?.includes(PermissionEnum.EVENTS_CREATE) ?? false;
  }
  isCanUpdate(event: EventEntity, user: TJWTPayload): boolean {
    return (
      this.permissionService.canModify(
        event,
        user,
        PermissionEnum.EVENTS_UPDATE,
      ) &&
      !this.eventService.isCancelledEvent(event) &&
      event.status !== EventStatusEnum.COMPLETED
    );
  }
  isCanDelete(event: EventEntity, user: TJWTPayload): boolean {
    return this.permissionService.canModify(
      event,
      user,
      PermissionEnum.EVENTS_DELETE,
    );
  }
  isCanViewPublic(event: EventEntity): boolean {
    return this.eventService.isCanViewPublic(event);
  }
}
