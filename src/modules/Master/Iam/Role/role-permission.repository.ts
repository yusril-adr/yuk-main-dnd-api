import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { RolePermission } from '@entities/main/iam/role-permission.entity';

@Injectable()
export class RolePermissionRepository extends Repository<RolePermission> {
  constructor(private readonly dataSource: DataSource) {
    super(RolePermission, dataSource.createEntityManager());
  }

  async findByRoleId(roleId: string): Promise<RolePermission[]> {
    return this.find({
      where: { role: { id: roleId } },
      relations: { permission: true },
    });
  }
}
