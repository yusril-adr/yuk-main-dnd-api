import { PaginateStoryCommentsInput } from './paginate-story-comments.input';

export class PaginateStoryCommentsQuery {
  constructor(
    public readonly identifier: string,
    public readonly params: PaginateStoryCommentsInput,
  ) {}
}
