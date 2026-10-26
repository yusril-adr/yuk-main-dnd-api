import { IsNotEmpty, IsString, Matches, MaxLength } from 'class-validator';

export class StoryCommentContentParamDto {
  @IsString()
  @IsNotEmpty()
  @Matches(/\S/, { message: 'content must not be empty' })
  @MaxLength(1000)
  content: string;
}
