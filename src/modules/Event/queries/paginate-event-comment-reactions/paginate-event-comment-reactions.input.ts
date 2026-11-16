import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, Max, Min } from 'class-validator';
import { EventCommentReactionTypeEnum } from '../../enums/event-comment-reaction-type.enum';

// Order is fixed (newest first). Only page, per_page, and optional type are used.
export class PaginateEventCommentReactionsInput {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  perPage: number = 10;

  @IsOptional()
  @Type(() => Number)
  @IsEnum(EventCommentReactionTypeEnum)
  type?: EventCommentReactionTypeEnum;
}
