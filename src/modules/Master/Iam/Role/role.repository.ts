import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { Role } from '@entities/main/role.entity';

@Injectable()
export class RoleRepository extends Repository<Role> {
  constructor(private readonly dataSource: DataSource) {
    super(Role, dataSource.createEntityManager());
  }
}
