import { IsEnum, IsNotEmpty } from 'class-validator';
import { StoryCommentReactionTypeEnum } from '../../../enums/story-comment-reaction-type.enum';

export class SetStoryCommentReactionInput {
  @IsNotEmpty()
  @IsEnum(StoryCommentReactionTypeEnum)
  type: StoryCommentReactionTypeEnum;
}
