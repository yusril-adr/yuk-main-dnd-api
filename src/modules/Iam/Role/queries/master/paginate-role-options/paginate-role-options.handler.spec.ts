import { ILike } from 'typeorm';
import { OrderKeyEnum } from '@shared/enums/order.enum';
import { RoleRepository } from '../../../repositories/role.repository';
import { PaginateRoleOptionsHandler } from './paginate-role-options.handler';
import { PaginateRoleOptionsInput } from './paginate-role-options.input';
import { PaginateRoleOptionsQuery } from './paginate-role-options.query';

const GUILD_MASTER_ID = '6d9f0c1e-7b2a-4e5d-9c31-1a2b3c4d5e6f';

class RoleOptionRows {
  findCalls: unknown[] = [];
  countCalls: unknown[] = [];

  find(options: unknown) {
    this.findCalls.push(options);
    return Promise.resolve([
      {
        id: GUILD_MASTER_ID,
        name: 'Guild Master',
        key: 'guild-master',
        description: 'full role payload',
      },
    ]);
  }

  count(options: unknown) {
    this.countCalls.push(options);
    return Promise.resolve(12);
  }
}

describe('PaginateRoleOptionsHandler', () => {
  it('returns id and name for a name search on page 2', async () => {
    const rows = new RoleOptionRows();
    const handler = new PaginateRoleOptionsHandler(
      rows as unknown as RoleRepository,
    );
    const params = new PaginateRoleOptionsInput();
    params.search = 'Guild';
    params.page = 2;
    params.perPage = 10;
    params.sortBy = 'name';
    params.order = OrderKeyEnum.ASC;

    const output = await handler.execute(new PaginateRoleOptionsQuery(params));

    expect(output.count).toBe(12);
    expect(output.data).toEqual([
      { id: GUILD_MASTER_ID, name: 'Guild Master' },
    ]);
    expect(rows.findCalls).toEqual([
      {
        select: { id: true, name: true },
        order: { name: 'asc' },
        where: [{ name: ILike('%Guild%') }],
        take: 10,
        skip: 10,
      },
    ]);
    expect(rows.countCalls).toEqual([
      {
        where: [{ name: ILike('%Guild%') }],
      },
    ]);
  });

  it('lists the first page by name ascending when the dropdown sends no filters', async () => {
    const rows = new RoleOptionRows();
    const handler = new PaginateRoleOptionsHandler(
      rows as unknown as RoleRepository,
    );
    const params = new PaginateRoleOptionsInput();

    const output = await handler.execute(new PaginateRoleOptionsQuery(params));

    expect(output.data).toEqual([
      { id: GUILD_MASTER_ID, name: 'Guild Master' },
    ]);
    expect(rows.findCalls).toEqual([
      {
        select: { id: true, name: true },
        order: { name: 'asc' },
        take: 10,
        skip: 0,
      },
    ]);
    expect(rows.countCalls).toEqual([{ where: undefined }]);
  });
});
