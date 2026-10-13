import { PaginateMyExperiencePointsInput } from './paginate-my-experience-points.input';

export class PaginateMyExperiencePointsQuery {
  constructor(
    public readonly userId: string,
    public readonly params: PaginateMyExperiencePointsInput,
  ) {}
}
