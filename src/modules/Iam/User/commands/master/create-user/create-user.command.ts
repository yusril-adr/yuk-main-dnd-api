import { CreateUserInput } from './create-user.input';

export class CreateUserCommand {
  constructor(public readonly params: CreateUserInput) {}
}
