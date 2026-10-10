import type { TPermission } from '@entities/main/iam/permission.entity';
import { PermissionEntityDto } from '@shared/dtos/entities/iam/permission.entity.dto';

export class PaginatePermissionsItemOutput extends PermissionEntityDto {
  constructor(payload: TPermission) {
    super();
    this.parseEntity(payload);
  }
}

export class PaginatePermissionsOutput {
  public readonly data: PaginatePermissionsItemOutput[];
  public readonly count: number;

  constructor(data: TPermission[], count: number) {
    this.data = data.map((item) => new PaginatePermissionsItemOutput(item));
    this.count = count;
  }
}
