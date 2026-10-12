import { Injectable } from '@nestjs/common';
import { PermissionEnum } from '@shared/enums/permission.enum';
import type { TJWTPayload } from '@shared/types/jwt-payload.type';
import type { TUserActionList } from '../types/user-action-list.type';

@Injectable()
export class UserPermissionService {
  resolveActionList(actor: TJWTPayload): TUserActionList {
    const permissionKeys = new Set(
      Array.isArray(actor.permissions) ? actor.permissions : [],
    );
    return {
      isCanUpdate: permissionKeys.has(PermissionEnum.USERS_UPDATE),
      isCanDelete: permissionKeys.has(PermissionEnum.USERS_DELETE),
      isCanViewBalances: permissionKeys.has(PermissionEnum.POINTS_VIEW),
    };
  }
}
