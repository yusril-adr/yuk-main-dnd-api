import { PaginateParamDto } from '@shared/dtos/params/paginate.param.dto';

// Order is fixed (oldest first), so only page and per_page apply.
export class PaginateEventCommentRepliesInput extends PaginateParamDto {}
