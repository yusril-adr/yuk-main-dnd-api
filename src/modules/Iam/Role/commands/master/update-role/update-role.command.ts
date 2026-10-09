import { UpdateRoleInput } from './update-role.input';

export class UpdateRoleCommand {
  constructor(
    public readonly id: string,
    public readonly params: UpdateRoleInput,
  ) {}
}
