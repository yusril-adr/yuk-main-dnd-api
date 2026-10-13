export class FindOneStoryQuery {
  constructor(
    public readonly identifier: string,
    public readonly userId: string | null,
  ) {}
}
