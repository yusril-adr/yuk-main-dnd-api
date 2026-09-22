import { Reflector } from '@nestjs/core';
import { PermissionEnum } from '@shared/enums/permission.enum';

export const Permissions = Reflector.createDecorator<PermissionEnum[]>();
