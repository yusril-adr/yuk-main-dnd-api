import { ILike, In } from 'typeorm';
import { UserRepository } from '../../repositories/user.repository';
import { PaginatePublicUsersHandler } from './paginate-public-users.handler';
import { PaginatePublicUsersInput } from './paginate-public-users.input';
import {
  NoClientSort,
  PaginatePublicUsersQuery,
} from './paginate-public-users.query';

const DM_ID = '11111111-1111-4111-8111-111111111111';
const PLAYER_ID = '22222222-2222-4222-8222-222222222222';
const ACE_ID = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const MAGE_ID = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';
const STAFF_ID = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const CREATED_AT = new Date('2024-01-02T03:04:05.000Z');
const VISIBLE_SQL = (alias: string) =>
  `EXISTS (SELECT 1 FROM user_roles ur INNER JOIN roles r ON r.id = ur.role_id WHERE ur.user_id = ${alias} AND r.is_show_in_public = true AND ur.deleted_at IS NULL AND r.deleted_at IS NULL)`;

type _AssertNoSort = NoClientSort<PaginatePublicUsersInput>;
const _sorted: _AssertNoSort = new PaginatePublicUsersInput();
void _sorted;

function role(id: string, key: string, name: string, isShowInPublic: boolean) {
  return {
    id,
    key,
    name,
    isShowInPublic,
    description: 'internal',
    createdAt: CREATED_AT,
    updatedAt: CREATED_AT,
  };
}

function user(overrides: Record<string, unknown>) {
  return {
    id: DM_ID,
    username: 'nyx',
    email: 'secret@example.com',
    password: 'hash',
    displayName: 'Nyx',
    bio: 'Runs games',
    playerExp: 10,
    playerLevel: 2,
    dmExp: 50,
    dmLevel: 3,
    points: 999,
    avatarFile: { bucket: 'avatars', path: 'nyx.png', driver: 1 },
    userRoles: [
      { role: role(MAGE_ID, 'mage', 'Mage', true) },
      { role: role(STAFF_ID, 'staff', 'Staff', false) },
      { role: role(ACE_ID, 'ace', 'Ace', true) },
    ],
    createdAt: CREATED_AT,
    updatedAt: new Date('2024-06-01T00:00:00.000Z'),
    ...overrides,
  };
}

class UserRows {
  findCalls: any[] = [];
  countCalls: any[] = [];
  private findResults: unknown[][] = [];
  private countResult = 0;

  script(findResults: unknown[][], countResult: number) {
    this.findResults = findResults;
    this.countResult = countResult;
  }

  find(options: unknown) {
    this.findCalls.push(options);
    return Promise.resolve(this.findResults.shift() ?? []);
  }

  count(options: unknown) {
    this.countCalls.push(options);
    return Promise.resolve(this.countResult);
  }
}

class PublicUrls {
  getPublicUrlSync(file: { path: string }) {
    return `https://cdn.example/${file.path}`;
  }
}

function handlerWith(rows: UserRows) {
  return new PaginatePublicUsersHandler(
    rows as unknown as UserRepository,
    new PublicUrls() as never,
  );
}

describe('PaginatePublicUsersHandler', () => {
  it('searches username or display name on page 2 and ignores sort fields', async () => {
    const rows = new UserRows();
    rows.script([[{ id: DM_ID }], [user({})]], 12);
    const params = new PaginatePublicUsersInput();
    params.search = 'Nyx';
    params.page = 2;
    params.perPage = 10;
    (params as { sortBy?: string }).sortBy = 'email';
    (params as { order?: string }).order = 'asc';
    const built = new PaginatePublicUsersQuery(params);

    const output = await handlerWith(rows).execute(built);

    expect(built.params).toEqual({ search: 'Nyx', page: 2, perPage: 10 });
    expect(output.count).toBe(12);
    expect(output.data).toEqual([
      {
        id: DM_ID,
        username: 'nyx',
        displayName: 'Nyx',
        avatarUrl: 'https://cdn.example/nyx.png',
        dmExp: 50,
        dmLevel: 3,
        playerExp: 10,
        playerLevel: 2,
        roles: [
          { id: ACE_ID, key: 'ace', name: 'Ace' },
          { id: MAGE_ID, key: 'mage', name: 'Mage' },
        ],
      },
    ]);
    expect(rows.findCalls[0].select).toEqual({
      id: true,
      dmExp: true,
      playerExp: true,
    });
    expect(rows.findCalls[0].order).toEqual({
      dmExp: 'desc',
      playerExp: 'desc',
      id: 'asc',
    });
    expect(rows.findCalls[0].take).toBe(10);
    expect(rows.findCalls[0].skip).toBe(10);
    expect(rows.findCalls[0].relations).toBeUndefined();
    expect(Object.keys(rows.findCalls[0].where[0]).sort()).toEqual([
      'id',
      'username',
    ]);
    expect(Object.keys(rows.findCalls[0].where[1]).sort()).toEqual([
      'displayName',
      'id',
    ]);
    expect(rows.findCalls[0].where[0].username).toEqual(ILike('%Nyx%'));
    expect(rows.findCalls[0].where[1].displayName).toEqual(ILike('%Nyx%'));
    expect(rows.findCalls[0].where[0].id.getSql('users.id')).toBe(
      VISIBLE_SQL('users.id'),
    );
    expect(rows.findCalls[0].where[1].id.getSql('users.id')).toBe(
      VISIBLE_SQL('users.id'),
    );
    expect(rows.countCalls[0].where).toBe(rows.findCalls[0].where);
    expect(rows.findCalls[1]).toEqual({
      where: { id: In([DM_ID]) },
      relations: { avatarFile: true, userRoles: { role: true } },
    });
  });

  it('lists the first page by dm exp then player exp when no filters are sent', async () => {
    const rows = new UserRows();
    rows.script([[]], 0);
    const output = await handlerWith(rows).execute(
      new PaginatePublicUsersQuery(new PaginatePublicUsersInput()),
    );

    expect(output).toEqual({ data: [], count: 0 });
    expect(rows.findCalls).toHaveLength(1);
    expect(rows.findCalls[0].order).toEqual({
      dmExp: 'desc',
      playerExp: 'desc',
      id: 'asc',
    });
    expect(rows.findCalls[0].take).toBe(10);
    expect(rows.findCalls[0].skip).toBe(0);
    expect(Object.keys(rows.findCalls[0].where)).toEqual(['id']);
    expect(rows.findCalls[0].where.id.getSql('users.id')).toBe(
      VISIBLE_SQL('users.id'),
    );
    expect(rows.countCalls).toEqual([{ where: rows.findCalls[0].where }]);
  });

  it('treats a blank search as no search and does not hydrate an empty page', async () => {
    const rows = new UserRows();
    rows.script([[]], 0);
    const params = new PaginatePublicUsersInput();
    params.search = '   ';

    const output = await handlerWith(rows).execute(
      new PaginatePublicUsersQuery(params),
    );

    expect(output).toEqual({ data: [], count: 0 });
    expect(rows.findCalls).toHaveLength(1);
    expect(Object.keys(rows.findCalls[0].where)).toEqual(['id']);
    expect(rows.findCalls[0].where.id.getSql('users.id')).toBe(
      VISIBLE_SQL('users.id'),
    );
  });

  it('keeps the page id order when hydration comes back reversed', async () => {
    const rows = new UserRows();
    rows.script(
      [
        [{ id: DM_ID }, { id: PLAYER_ID }],
        [
          user({
            id: PLAYER_ID,
            username: null,
            displayName: 'Nyx Two',
            dmExp: 100,
            playerExp: 40,
            playerLevel: 4,
            dmLevel: 5,
            avatarFile: null,
            userRoles: [{ role: role(MAGE_ID, 'mage', 'Mage', true) }],
          }),
          user({ dmExp: 100 }),
        ],
      ],
      2,
    );

    const output = await handlerWith(rows).execute(
      new PaginatePublicUsersQuery(new PaginatePublicUsersInput()),
    );

    expect(output.data.map((row) => row.id)).toEqual([DM_ID, PLAYER_ID]);
    expect(output.data[1]).toEqual({
      id: PLAYER_ID,
      username: null,
      displayName: 'Nyx Two',
      avatarUrl: null,
      dmExp: 100,
      dmLevel: 5,
      playerExp: 40,
      playerLevel: 4,
      roles: [{ id: MAGE_ID, key: 'mage', name: 'Mage' }],
    });
    expect(rows.findCalls[1]).toEqual({
      where: { id: In([DM_ID, PLAYER_ID]) },
      relations: { avatarFile: true, userRoles: { role: true } },
    });
  });
});
