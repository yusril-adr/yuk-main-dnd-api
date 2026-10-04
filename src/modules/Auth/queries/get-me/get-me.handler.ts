import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { AuthService } from '../../services/auth.service';
import { GetMeQuery } from './get-me.query';
import { GetMeOutput } from './get-me.output';

@QueryHandler(GetMeQuery)
export class GetMeHandler implements IQueryHandler<GetMeQuery, GetMeOutput> {
  constructor(private readonly authService: AuthService) {}

  async execute(query: GetMeQuery): Promise<GetMeOutput> {
    return this.authService.loginByAccessToken(query.token);
  }
}