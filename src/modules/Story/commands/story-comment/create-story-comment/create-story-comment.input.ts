import { IsOptional, IsUUID } from 'class-validator';
import { StoryCommentContentParamDto } from '@shared/dtos/params/story-comment-content.param.dto';

export class CreateStoryCommentInput extends StoryCommentContentParamDto {
  // Reply target. A reply to a reply is attached to that reply's parent.
  @IsOptional()
  @IsUUID()
  parentId?: string;
}
