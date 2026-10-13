import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { NotFoundException } from '@nestjs/common';
import { isUUID } from 'class-validator';
import { StorageService } from '@modules/Global/services/storage.service';
import { User } from '@entities/main/iam/user.entity';
import { UserRepository } from '../../repositories/user.repository';
import {
  publicUserDetailById,
  publicUserDetailByUsername,
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
    const identifier = query.identifier.trim();
    const user = await this.findPublicUser(identifier);
    if (!user) {
      throw new NotFoundException(
        `User with identifier ${query.identifier} not found`,
      );
    }
    const avatarUrl = user.avatarFile
      ? this.storageService.getPublicUrlSync(user.avatarFile)
      : null;
    return toPublicUserProfile(user, avatarUrl);
  }

  private async findPublicUser(identifier: string): Promise<User | null> {
    if (!identifier) {
      return null;
    }
    if (isUUID(identifier)) {
      const byId = await this.userRepository.findOne(
        publicUserDetailById(identifier),
      );
      if (byId) {
        return byId;
      }
    }
    return this.userRepository.findOne(publicUserDetailByUsername(identifier));
  }
}
