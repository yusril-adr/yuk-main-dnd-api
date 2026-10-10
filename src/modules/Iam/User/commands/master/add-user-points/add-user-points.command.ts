import { AddUserPointsInput } from './add-user-points.input';

export class AddUserPointsCommand {
  constructor(
    public readonly id: string,
    public readonly params: AddUserPointsInput,
  ) {}
}
