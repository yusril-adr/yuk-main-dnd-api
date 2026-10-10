import { IsArray, IsUUID } from 'class-validator';

export class CompleteStoryInput {
  @IsArray()
  @IsUUID('4', { each: true })
  userIds: string[];
}
