import { PaginateUserPointsInput } from './paginate-user-points.input';

export class PaginateUserPointsQuery {
  constructor(
    public readonly id: string,
    public readonly params: PaginateUserPointsInput,
  ) {}
}
