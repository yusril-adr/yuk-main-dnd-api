import { PaginateUserExperiencePointsInput } from './paginate-user-experience-points.input';

export class PaginateUserExperiencePointsQuery {
  constructor(
    public readonly id: string,
    public readonly params: PaginateUserExperiencePointsInput,
  ) {}
}
