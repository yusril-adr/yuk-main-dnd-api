import { PermissionEnum } from '@shared/enums/permission.enum';

export type TJWTPayload = {
  id: string;
  name: string;
  email: string;
  role: PermissionEnum;
};
