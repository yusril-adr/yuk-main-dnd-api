import { PaginateParamDto } from '@shared/dtos/params/paginate.param.dto';

// Order is fixed (pinned first, then newest), so only page and per_page apply.
export class PaginateEventCommentsInput extends PaginateParamDto {}
