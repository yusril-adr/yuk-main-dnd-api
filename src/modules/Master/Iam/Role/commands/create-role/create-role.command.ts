import { CreateRoleInput } from './create-role.input';

export class CreateRoleCommand {
  constructor(public readonly params: CreateRoleInput) {}
}