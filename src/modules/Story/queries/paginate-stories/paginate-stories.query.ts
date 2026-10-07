import { PaginateStoriesInput } from './paginate-stories.input';

export class PaginateStoriesQuery {
  constructor(public readonly params: PaginateStoriesInput) {}
}
