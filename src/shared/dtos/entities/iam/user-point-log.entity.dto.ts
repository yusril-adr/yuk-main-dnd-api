import type { TUserPointLog } from '@entities/main/iam/user-point-log.entity';
import dayjs from '@shared/utils/dayjs';

export type TUserPointLogEntityDto = {
  id: string;
  amount: number;
  type: number;
  description: string | null;
  createdAt: string;
  updatedAt: string;
};

export class UserPointLogEntityDto implements TUserPointLogEntityDto {
  id: string;
  amount: number;
  type: number;
  description: string | null;
  createdAt: string;
  updatedAt: string;

  parseEntity(log: TUserPointLog): UserPointLogEntityDto {
    this.id = log.id;
    this.amount = log.amount;
    this.type = log.type;
    this.description = log.description ?? null;
    this.createdAt = dayjs(log.createdAt).toISOString();
    this.updatedAt = dayjs(log.updatedAt).toISOString();
    return this;
  }
}
