import { NotFoundException } from '@nestjs/common';
import { Equal } from 'typeorm';
import { UserRepository } from '../../repositories/user.repository';
import { FindOnePublicUserHandler } from './find-one-public-user.handler';
import { FindOnePublicUserQuery } from './find-one-public-user.query';

const DM_ID = '11111111-1111-4111-8111-111111111111';
const ACE_ID = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const MAGE_ID = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';
const STAFF_ID = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const CREATED_AT = new Date('2024-01-02T03:04:05.000Z');
const VISIBLE_SQL =
  'EXISTS (SELECT 1 FROM user_roles ur INNER JOIN roles r ON r.id = ur.role_id WHERE ur.user_id = users.id AND r.is_show_in_public = true AND ur.deleted_at IS NULL AND r.deleted_at IS NULL)';

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

function user(overrides: Record<string, unknown> = {}) {
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
  findOneCalls: any[] = [];
  private findOneResult: unknown = null;

  script(result: unknown) {
    this.findOneResult = result;
  }

  findOne(options: unknown) {
    this.findOneCalls.push(options);
    return Promise.resolve(this.findOneResult);
  }
}

class PublicUrls {
  getPublicUrlSync(file: { path: string }) {
    return `https://cdn.example/${file.path}`;
  }
}

describe('FindOnePublicUserHandler', () => {
  it('returns a public profile and strips hidden roles', async () => {
    const rows = new UserRows();
    rows.script(user());
    const handler = new FindOnePublicUserHandler(
      rows as unknown as UserRepository,
      new PublicUrls() as never,
    );

    const output = await handler.execute(new FindOnePublicUserQuery(DM_ID));

    expect(output).toEqual({
      id: DM_ID,
      username: 'nyx',
      displayName: 'Nyx',
      avatarUrl: 'https://cdn.example/nyx.png',
      bio: 'Runs games',
      dmExp: 50,
      dmLevel: 3,
      playerExp: 10,
      playerLevel: 2,
      roles: [
        { id: ACE_ID, key: 'ace', name: 'Ace' },
        { id: MAGE_ID, key: 'mage', name: 'Mage' },
      ],
      createdAt: '2024-01-02T03:04:05.000Z',
    });
    expect(rows.findOneCalls[0].relations).toEqual({
      avatarFile: true,
      userRoles: { role: true },
    });
    expect(rows.findOneCalls[0].where.id.type).toBe('and');
    const [equalOp, visibleOp] = rows.findOneCalls[0].where.id.value;
    expect(equalOp).toEqual(Equal(DM_ID));
    expect(visibleOp.getSql('users.id')).toBe(VISIBLE_SQL);
  });

  it('throws not found when the directory query returns nothing', async () => {
    const rows = new UserRows();
    rows.script(null);
    const handler = new FindOnePublicUserHandler(
      rows as unknown as UserRepository,
      new PublicUrls() as never,
    );

    await expect(
      handler.execute(new FindOnePublicUserQuery(DM_ID)),
    ).rejects.toThrow(new NotFoundException(`User with id ${DM_ID} not found`));
  });
});
