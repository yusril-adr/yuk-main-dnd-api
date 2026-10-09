import { ArrayNotEmpty, IsArray, IsUUID } from 'class-validator';

export class AddStoryMembersInput {
  @IsArray()
  @ArrayNotEmpty()
  @IsUUID('4', { each: true })
  userIds: string[];
}
