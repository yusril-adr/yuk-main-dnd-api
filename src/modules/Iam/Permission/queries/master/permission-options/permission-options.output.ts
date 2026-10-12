import type { TPermission } from '@entities/main/iam/permission.entity';
import type { TPermissionEntityDto } from '@shared/dtos/entities/iam/permission.entity.dto';

export class PermissionOptionsItemOutput implements Pick<
  TPermissionEntityDto,
  'id' | 'module' | 'action'
> {
  id: string;
  module: string;
  action: string;

  constructor(payload: TPermission) {
    this.id = payload.id;
    this.module = payload.module;
    this.action = payload.action;
  }
}

export class PermissionOptionsOutput {
  public readonly data: PermissionOptionsItemOutput[];

  constructor(data: TPermission[]) {
    this.data = data.map((item) => new PermissionOptionsItemOutput(item));
  }
}
