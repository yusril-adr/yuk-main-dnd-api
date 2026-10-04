import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { Role } from '@entities/main/iam/role.entity';

// TODO: Move RoleRepository to public module (e.g., modules/roles) when the public module is created.
@Injectable()
export class RoleRepository extends Repository<Role> {
  constructor(private readonly dataSource: DataSource) {
    super(Role, dataSource.createEntityManager());
  }
}