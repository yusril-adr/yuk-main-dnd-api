import { PaginateMyPointsInput } from './paginate-my-points.input';

export class PaginateMyPointsQuery {
  constructor(
    public readonly userId: string,
    public readonly params: PaginateMyPointsInput,
  ) {}
}
