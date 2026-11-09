import { TEventMember } from '@entities/main/event/event-member.entity';

export type TEventMemberUserDto = {
  id: string;
  displayName: string;
  username?: string | null;
  avatarUrl?: string | null;
  isGuest: boolean;
};

export type TEventMemberEntityDto = Pick<TEventMember, 'id' | 'status'> & {
  status: number;
  user: TEventMemberUserDto;
};

export class EventMemberEntityDto implements TEventMemberEntityDto {
  id: string;
  status: number;
  user: TEventMemberUserDto;

  parseEntity(
    eventMember: TEventMember,
    avatarUrl?: string | null,
  ): EventMemberEntityDto {
    this.id = eventMember.id;
    this.status = eventMember.status;
    this.user = {
      id: eventMember.user.id,
      displayName: eventMember.user.displayName,
      username: eventMember.user.username ?? null,
      avatarUrl: avatarUrl ?? null,
      isGuest: eventMember.user.isGuest === true,
    };

    return this;
  }
}
