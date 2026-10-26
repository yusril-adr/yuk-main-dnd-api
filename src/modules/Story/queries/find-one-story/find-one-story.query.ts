import type { TJWTPayload } from '@shared/types/jwt-payload.type';

export class FindOneStoryQuery {
  constructor(
    public readonly identifier: string,
    public readonly user: TJWTPayload | null,
  ) {}
}
