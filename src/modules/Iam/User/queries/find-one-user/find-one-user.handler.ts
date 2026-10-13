import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { UserService } from '../../services/user.service';
import { FindOneUserQuery } from './find-one-user.query';
import { FindOneUserOutput } from './find-one-user.output';

@QueryHandler(FindOneUserQuery)
export class FindOneUserHandler implements IQueryHandler<
  FindOneUserQuery,
  FindOneUserOutput
> {
  constructor(private readonly userService: UserService) {}

  async execute(query: FindOneUserQuery): Promise<FindOneUserOutput> {
    const user = await this.userService.findPublicByIdentifier(
      query.identifier,
      {
        relations: { avatarFile: true, userRoles: { role: true } },
      },
    );
    const avatarUrl = await this.userService.resolveAvatarUrl(user);
    return new FindOneUserOutput(user, avatarUrl ?? null);
  }
}
