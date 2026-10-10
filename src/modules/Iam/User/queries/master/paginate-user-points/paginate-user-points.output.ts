import type { TUserPointLog } from '@entities/main/iam/user-point-log.entity';
import { UserPointLogEntityDto } from '@shared/dtos/entities/iam/user-point-log.entity.dto';

export class PaginateUserPointsItemOutput extends UserPointLogEntityDto {
  constructor(payload: TUserPointLog) {
    super();
    this.parseEntity(payload);
  }
}

export class PaginateUserPointsOutput {
  public readonly data: PaginateUserPointsItemOutput[];
  public readonly count: number;

  constructor(logs: TUserPointLog[], count: number) {
    this.data = logs.map((log) => new PaginateUserPointsItemOutput(log));
    this.count = count;
  }
}
