import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { StorageService } from '@modules/Global/services/storage.service';
import { UserRepository } from '../../repositories/user.repository';
import {
  publicUserListOptions,
  toPublicUserCard,
} from '../public-user-directory';
import { PaginatePublicUsersQuery } from './paginate-public-users.query';
import { PaginatePublicUsersOutput } from './paginate-public-users.output';

@QueryHandler(PaginatePublicUsersQuery)
export class PaginatePublicUsersHandler implements IQueryHandler<
  PaginatePublicUsersQuery,
  PaginatePublicUsersOutput
> {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly storageService: StorageService,
  ) {}

  async execute(
    query: PaginatePublicUsersQuery,
  ): Promise<PaginatePublicUsersOutput> {
    const options = publicUserListOptions(query.params);
    const page = await this.userRepository.find(options.page);
    const count = await this.userRepository.count(options.count);
    if (page.length === 0) {
      return new PaginatePublicUsersOutput([], count);
    }

    const ids = page.map((row) => row.id);
    const hydrated = await this.userRepository.find(options.hydrate(ids));
    const byId = new Map(hydrated.map((user) => [user.id, user]));
    const ordered = ids.flatMap((id) => {
      const user = byId.get(id);
      return user ? [user] : [];
    });
    const cards = ordered.map((user) =>
      toPublicUserCard(
        user,
        user.avatarFile
          ? this.storageService.getPublicUrlSync(user.avatarFile)
          : null,
      ),
    );
    return new PaginatePublicUsersOutput(cards, count);
  }
}
