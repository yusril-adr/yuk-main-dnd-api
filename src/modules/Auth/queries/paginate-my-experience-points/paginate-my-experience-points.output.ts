import type { TUserExpLog } from '@entities/main/iam/user-exp-log.entity';
import { UserExpLogEntityDto } from '@shared/dtos/entities/iam/user-exp-log.entity.dto';

export class PaginateMyExperiencePointsItemOutput extends UserExpLogEntityDto {
  constructor(payload: TUserExpLog) {
    super();
    this.parseEntity(payload);
  }
}

export class PaginateMyExperiencePointsOutput {
  public readonly data: PaginateMyExperiencePointsItemOutput[];
  public readonly count: number;

  constructor(logs: TUserExpLog[], count: number) {
    this.data = logs.map(
      (log) => new PaginateMyExperiencePointsItemOutput(log),
    );
    this.count = count;
  }
}
