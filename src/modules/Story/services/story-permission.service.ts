import { ForbiddenException, Injectable } from '@nestjs/common';
import { Story } from '@entities/main/story/story.entity';
import { PermissionEnum } from '@shared/enums/permission.enum';
import type { TJWTPayload } from '@shared/types/jwt-payload.type';

@Injectable()
export class StoryPermissionService {
  canModify(story: Story, user: TJWTPayload, permission: PermissionEnum) {
    const hasPermission = user.permissions?.includes(permission) ?? false;
    const isCreator = story.createdBy?.id === user.id;

    return hasPermission || isCreator;
  }

  assertCanModify(
    story: Story,
    user: TJWTPayload,
    permission: PermissionEnum,
  ): void {
    if (!this.canModify(story, user, permission)) {
      throw new ForbiddenException(
        'Your permission is not allowed to access this story',
      );
    }
  }
}
