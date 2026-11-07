import { Injectable } from '@nestjs/common';
import { EventEntity as Event } from '@entities/main/event/event.entity';
import { PermissionEnum } from '@shared/enums/permission.enum';
import type { TJWTPayload } from '@shared/types/jwt-payload.type';

@Injectable()
export class EventPermissionService {
  canModify(event: Event, user: TJWTPayload, permission: PermissionEnum) {
    const hasPermission = user.permissions?.includes(permission) ?? false;
    const isCreator = event.createdBy?.id === user.id;

    return hasPermission || isCreator;
  }
}
