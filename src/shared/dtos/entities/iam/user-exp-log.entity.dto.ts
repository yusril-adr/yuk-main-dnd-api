import type { TUserExpLog } from '@entities/main/iam/user-exp-log.entity';
import dayjs from '@shared/utils/dayjs';

export type TUserExpLogEntityDto = {
  id: string;
  amount: number;
  type: number;
  description: string | null;
  createdAt: string;
  updatedAt: string;
};

export class UserExpLogEntityDto implements TUserExpLogEntityDto {
  id: string;
  amount: number;
  type: number;
  description: string | null;
  createdAt: string;
  updatedAt: string;

  parseEntity(log: TUserExpLog): UserExpLogEntityDto {
    this.id = log.id;
    this.amount = log.amount;
    this.type = log.type;
    this.description = log.description ?? null;
    this.createdAt = dayjs(log.createdAt).toISOString();
    this.updatedAt = dayjs(log.updatedAt).toISOString();
    return this;
  }
}
