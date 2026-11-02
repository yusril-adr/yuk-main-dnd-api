import type { TUser } from '@entities/main/iam/user.entity';
import {
  publicRoles,
  type TPaginateUsersItemOutput,
  type TPublicUserRole,
} from '../paginate-users/paginate-users.output';

export type TGetTopDmExperienceItemOutput = TPaginateUsersItemOutput & {
  gainedDmExp: number;
};

export class GetTopDmExperienceItemOutput implements TGetTopDmExperienceItemOutput {
  id: string;
  username: string | null;
  displayName: string;
  avatarUrl: string | null;
  dmExp: number;
  dmLevel: number;
  playerExp: number;
  playerLevel: number;
  roles: TPublicUserRole[];
  gainedDmExp: number;

  constructor(payload: TUser, avatarUrl: string | null, gainedDmExp: number) {
    this.id = payload.id;
    this.username = payload.username ?? null;
    this.displayName = payload.displayName;
    this.avatarUrl = avatarUrl;
    this.dmExp = payload.dmExp;
    this.dmLevel = payload.dmLevel;
    this.playerExp = payload.playerExp;
    this.playerLevel = payload.playerLevel;
    this.roles = publicRoles(payload);
    this.gainedDmExp = gainedDmExp;
  }
}

export class GetTopDmExperienceOutput {
  public readonly data: GetTopDmExperienceItemOutput[];

  constructor(
    users: TUser[],
    avatarUrls: (string | null)[],
    gainedDmExps: number[],
  ) {
    this.data = users.map(
      (user, index) =>
        new GetTopDmExperienceItemOutput(
          user,
          avatarUrls[index],
          gainedDmExps[index],
        ),
    );
  }
}
