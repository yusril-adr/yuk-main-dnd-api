import type { TRole } from '@entities/main/iam/role.entity';

export class PaginateRoleOptionsItemOutput {
  id: string;
  name: string;

  constructor(role: Pick<TRole, 'id' | 'name'>) {
    this.id = role.id;
    this.name = role.name;
  }
}

export class PaginateRoleOptionsOutput {
  public readonly data: PaginateRoleOptionsItemOutput[];
  public readonly count: number;

  constructor(roles: Pick<TRole, 'id' | 'name'>[], count: number) {
    this.data = roles.map((role) => new PaginateRoleOptionsItemOutput(role));
    this.count = count;
  }
}
