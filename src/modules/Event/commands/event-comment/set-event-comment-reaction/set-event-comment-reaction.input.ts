import { IsEnum, IsNotEmpty } from 'class-validator';
import { EventCommentReactionTypeEnum } from '../../../enums/event-comment-reaction-type.enum';

export class SetEventCommentReactionInput {
  @IsNotEmpty()
  @IsEnum(EventCommentReactionTypeEnum)
  type: EventCommentReactionTypeEnum;
}
