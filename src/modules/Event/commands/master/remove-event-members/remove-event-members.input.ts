import { ArrayNotEmpty, IsArray, IsUUID } from 'class-validator';

export class RemoveEventMembersInput {
  @IsArray()
  @ArrayNotEmpty()
  @IsUUID('4', { each: true })
  userIds: string[];
}
