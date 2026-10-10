import type { TUserExpLog } from '@entities/main/iam/user-exp-log.entity';
import { UserExpLogEntityDto } from '@shared/dtos/entities/iam/user-exp-log.entity.dto';

export class PaginateUserExperiencePointsItemOutput extends UserExpLogEntityDto {
  constructor(payload: TUserExpLog) {
    super();
    this.parseEntity(payload);
  }
}

export class PaginateUserExperiencePointsOutput {
  public readonly data: PaginateUserExperiencePointsItemOutput[];
  public readonly count: number;

  constructor(logs: TUserExpLog[], count: number) {
    this.data = logs.map(
      (log) => new PaginateUserExperiencePointsItemOutput(log),
    );
    this.count = count;
  }
}
