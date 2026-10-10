import type { TPermission } from '@entities/main/iam/permission.entity';
import { PermissionEntityDto } from '@shared/dtos/entities/iam/permission.entity.dto';

export class FindAllPermissionsItemOutput extends PermissionEntityDto {
  constructor(payload: TPermission) {
    super();
    this.parseEntity(payload);
  }
}

export class FindAllPermissionsOutput {
  public readonly data: FindAllPermissionsItemOutput[];

  constructor(data: TPermission[]) {
    this.data = data.map((item) => new FindAllPermissionsItemOutput(item));
  }
}
