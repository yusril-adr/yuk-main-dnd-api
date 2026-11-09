import { PaginateStoryCommentReactionsInput } from './paginate-story-comment-reactions.input';

export class PaginateStoryCommentReactionsQuery {
  constructor(
    public readonly identifier: string,
    public readonly commentId: string,
    public readonly params: PaginateStoryCommentReactionsInput,
  ) {}
}
