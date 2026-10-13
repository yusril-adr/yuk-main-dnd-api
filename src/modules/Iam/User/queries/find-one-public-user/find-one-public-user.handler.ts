import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { NotFoundException } from '@nestjs/common';
import { StorageService } from '@modules/Global/services/storage.service';
import { UserRepository } from '../../repositories/user.repository';
import {
  publicUserDetailOptions,
  toPublicUserProfile,
} from '../public-user-directory';
import { FindOnePublicUserQuery } from './find-one-public-user.query';
import type { PublicUserProfile } from '../public-user-directory';

@QueryHandler(FindOnePublicUserQuery)
export class FindOnePublicUserHandler implements IQueryHandler<
  FindOnePublicUserQuery,
  PublicUserProfile
> {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly storageService: StorageService,
  ) {}

  async execute(query: FindOnePublicUserQuery): Promise<PublicUserProfile> {
    const user = await this.userRepository.findOne(
      publicUserDetailOptions(query.id),
    );
    if (!user) {
      throw new NotFoundException(`User with id ${query.id} not found`);
    }
    const avatarUrl = user.avatarFile
      ? this.storageService.getPublicUrlSync(user.avatarFile)
      : null;
    return toPublicUserProfile(user, avatarUrl);
  }
}
