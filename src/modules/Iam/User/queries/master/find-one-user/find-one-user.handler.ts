import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { NotFoundException } from '@nestjs/common';
import { StorageService } from '@modules/Global/services/storage.service';
import { UserRepository } from '../../../repositories/user.repository';
import { FindOneUserQuery } from './find-one-user.query';
import { FindOneUserOutput } from './find-one-user.output';

@QueryHandler(FindOneUserQuery)
export class FindOneUserHandler implements IQueryHandler<
  FindOneUserQuery,
  FindOneUserOutput
> {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly storageService: StorageService,
  ) {}

  async execute(query: FindOneUserQuery): Promise<FindOneUserOutput> {
    const { id } = query;

    const user = await this.userRepository.findOne({
      where: { id },
      relations: {
        userRoles: { role: { rolePermissions: { permission: true } } },
        avatarFile: true,
      },
    });
    if (!user) {
      throw new NotFoundException(`User with id ${id} not found`);
    }

    const avatarUrl = user.avatarFile
      ? this.storageService.getPublicUrlSync(user.avatarFile)
      : undefined;

    return new FindOneUserOutput(user, avatarUrl);
  }
}
