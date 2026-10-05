import { UpdateStoryInput } from './update-story.input';

export class UpdateStoryCommand {
  constructor(
    public readonly id: string,
    public readonly params: UpdateStoryInput,
  ) {}
}
