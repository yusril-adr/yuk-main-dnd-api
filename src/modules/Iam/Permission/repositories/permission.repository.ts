import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { Permission } from '@entities/main/iam/permission.entity';

// TODO: Move PermissionRepository to public module (e.g., modules/permissions) when the public module is created.
@Injectable()
export class PermissionRepository extends Repository<Permission> {
  constructor(private readonly dataSource: DataSource) {
    super(Permission, dataSource.createEntityManager());
  }
}