import type { TPermission } from '@entities/main/iam/permission.entity';
import { PermissionEntityDto } from '@shared/dtos/entities/iam/permission.entity.dto';

export class FindAllPermissionsOutput {
  constructor(public readonly data: PermissionEntityDto[]) {}

  static from(data: TPermission[]): FindAllPermissionsOutput {
    return new FindAllPermissionsOutput(
      data.map((p) => new PermissionEntityDto().parseEntity(p)),
    );
  }
}
