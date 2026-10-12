import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { NotFoundException } from '@nestjs/common';
import { PermissionEnum } from '@shared/enums/permission.enum';
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

    const permissionKeys = new Set(
      Array.isArray(query.user.permissions) ? query.user.permissions : [],
    );
    const actionList = {
      isCanUpdate: permissionKeys.has(PermissionEnum.USERS_UPDATE),
      isCanDelete: permissionKeys.has(PermissionEnum.USERS_DELETE),
      isCanViewBalances: permissionKeys.has(PermissionEnum.POINTS_VIEW),
      isCanCreateBalances: permissionKeys.has(PermissionEnum.POINTS_CREATE),
    };
    return new FindOneUserOutput(user, actionList, avatarUrl);
  }
}
