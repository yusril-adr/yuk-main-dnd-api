import type { TPermission } from '@entities/main/iam/permission.entity';
import { PermissionEntityDto } from '@shared/dtos/entities/iam/permission.entity.dto';

export class PermissionOptionsItemOutput extends PermissionEntityDto {
  constructor(payload: TPermission) {
    super();
    this.parseEntity(payload);
  }
}

export class PermissionOptionsOutput {
  public readonly data: PermissionOptionsItemOutput[];

  constructor(data: TPermission[]) {
    this.data = data.map((item) => new PermissionOptionsItemOutput(item));
  }
}
