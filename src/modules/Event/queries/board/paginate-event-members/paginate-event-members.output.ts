import type { TEventMember } from '@entities/main/event/event-member.entity';
import { EventMemberEntityDto } from '@shared/dtos/entities/event/event-member.entity.dto';
import dayjs from '@shared/utils/dayjs';

export class PaginateEventMembersItemOutput extends EventMemberEntityDto {
  createdAt: string;

  constructor(payload: TEventMember, avatarUrl?: string | null) {
    super();
    this.parseEntity(payload, avatarUrl);
    if (payload.user.deletedAt) {
      this.user = {
        ...this.user,
        displayName: `${payload.user.displayName} (Deleted User)`,
      };
    }
    this.createdAt = dayjs(payload.createdAt).toISOString();
  }
}

export class PaginateEventMembersOutput {
  public readonly data: PaginateEventMembersItemOutput[];
  public readonly count: number;

  constructor(
    members: TEventMember[],
    avatarUrls: (string | null)[],
    count: number,
  ) {
    this.data = members.map(
      (member, i) => new PaginateEventMembersItemOutput(member, avatarUrls[i]),
    );
    this.count = count;
  }
}
