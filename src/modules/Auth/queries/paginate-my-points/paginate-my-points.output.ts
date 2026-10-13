import type { TUserPointLog } from '@entities/main/iam/user-point-log.entity';
import { UserPointLogEntityDto } from '@shared/dtos/entities/iam/user-point-log.entity.dto';

export class PaginateMyPointsItemOutput extends UserPointLogEntityDto {
  constructor(payload: TUserPointLog) {
    super();
    this.parseEntity(payload);
  }
}

export class PaginateMyPointsOutput {
  public readonly data: PaginateMyPointsItemOutput[];
  public readonly count: number;

  constructor(logs: TUserPointLog[], count: number) {
    this.data = logs.map((log) => new PaginateMyPointsItemOutput(log));
    this.count = count;
  }
}
