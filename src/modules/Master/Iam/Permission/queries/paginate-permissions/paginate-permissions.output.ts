import type { TPermission } from '@entities/main/iam/permission.entity';
import { PermissionEntityDto } from '@shared/dtos/entities/iam/permission.entity.dto';

export class PaginatePermissionsOutput {
  constructor(
    public readonly data: PermissionEntityDto[],
    public readonly count: number,
  ) {}

  static from(data: TPermission[], count: number): PaginatePermissionsOutput {
    return new PaginatePermissionsOutput(
      data.map((p) => new PermissionEntityDto().parseEntity(p)),
      count,
    );
  }
}