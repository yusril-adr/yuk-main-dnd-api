import { IsNotEmpty, IsUUID } from 'class-validator';

export class LinkGuestUserInput {
  @IsUUID('4')
  @IsNotEmpty()
  userId: string;
}
