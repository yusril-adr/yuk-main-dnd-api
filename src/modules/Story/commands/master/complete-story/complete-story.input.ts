import { ArrayMinSize, IsArray, IsUUID } from 'class-validator';

export class CompleteStoryInput {
  @IsArray()
  @ArrayMinSize(1, { message: 'At least one attended member is required' })
  @IsUUID('4', { each: true })
  userIds: string[];
}
