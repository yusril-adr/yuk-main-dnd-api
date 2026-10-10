import { AddUserExperiencePointsInput } from './add-user-experience-points.input';

export class AddUserExperiencePointsCommand {
  constructor(
    public readonly id: string,
    public readonly params: AddUserExperiencePointsInput,
  ) {}
}
