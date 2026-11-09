import { Type } from 'class-transformer';
import { IsEnum, IsOptional } from 'class-validator';
import { PaginateParamDto } from '@shared/dtos/params/paginate.param.dto';
import { StoryCommentReactionTypeEnum } from '../../enums/story-comment-reaction-type.enum';

// Order is fixed (newest first); optional type filters by reaction enum.
export class PaginateStoryCommentReactionsInput extends PaginateParamDto {
  @IsOptional()
  @Type(() => Number)
  @IsEnum(StoryCommentReactionTypeEnum)
  type?: StoryCommentReactionTypeEnum;
}
