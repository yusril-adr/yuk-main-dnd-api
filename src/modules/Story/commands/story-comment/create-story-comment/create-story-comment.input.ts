import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
} from 'class-validator';

export class CreateStoryCommentInput {
  @IsString()
  @IsNotEmpty()
  @Matches(/\S/, { message: 'content must not be empty' })
  @MaxLength(1000)
  content: string;

  // Reply target. A reply to a reply is attached to that reply's parent.
  @IsOptional()
  @IsUUID()
  parentId?: string;
}
