import type { TUser } from '@entities/main/iam/user.entity';
import {
  publicRoles,
  type TPaginateUsersItemOutput,
  type TPublicUserRole,
} from '../paginate-users/paginate-users.output';

export type TGetTopPlayerExperienceItemOutput = TPaginateUsersItemOutput & {
  gainedPlayerExp: number;
};

export class GetTopPlayerExperienceItemOutput implements TGetTopPlayerExperienceItemOutput {
  id: string;
  username: string | null;
  displayName: string;
  avatarUrl: string | null;
  dmExp: number;
  dmLevel: number;
  playerExp: number;
  playerLevel: number;
  roles: TPublicUserRole[];
  gainedPlayerExp: number;

  constructor(
    payload: TUser,
    avatarUrl: string | null,
    gainedPlayerExp: number,
  ) {
    this.id = payload.id;
    this.username = payload.username ?? null;
    this.displayName = payload.displayName;
    this.avatarUrl = avatarUrl;
    this.dmExp = payload.dmExp;
    this.dmLevel = payload.dmLevel;
    this.playerExp = payload.playerExp;
    this.playerLevel = payload.playerLevel;
    this.roles = publicRoles(payload);
    this.gainedPlayerExp = gainedPlayerExp;
  }
}

export class GetTopPlayerExperienceOutput {
  public readonly data: GetTopPlayerExperienceItemOutput[];

  constructor(
    users: TUser[],
    avatarUrls: (string | null)[],
    gainedPlayerExps: number[],
  ) {
    this.data = users.map(
      (user, index) =>
        new GetTopPlayerExperienceItemOutput(
          user,
          avatarUrls[index],
          gainedPlayerExps[index],
        ),
    );
  }
}
