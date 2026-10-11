export class FindOneStoryQuery {
  constructor(
    public readonly id: string,
    public readonly userId: string | null,
  ) {}
}
