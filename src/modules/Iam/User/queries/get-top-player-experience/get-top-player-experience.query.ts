import { GetTopPlayerExperienceInput } from './get-top-player-experience.input';

export class GetTopPlayerExperienceQuery {
  constructor(public readonly params: GetTopPlayerExperienceInput) {}
}
