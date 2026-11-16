import { PaginateEventCommentReactionsInput } from './paginate-event-comment-reactions.input';

export class PaginateEventCommentReactionsQuery {
  constructor(
    public readonly identifier: string,
    public readonly commentId: string,
    public readonly params: PaginateEventCommentReactionsInput,
  ) {}
}
