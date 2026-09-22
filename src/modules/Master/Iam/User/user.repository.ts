import { Injectable, NotFoundException } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { User } from '@entities/main/user.entity';

@Injectable()
export class UserRepository extends Repository<User> {
  constructor(private readonly dataSource: DataSource) {
    super(User, dataSource.createEntityManager());
  }

  async findAndValidateUserByIds(userIds: string[]): Promise<User[]> {
    const userDatas = await this.find({
      where: userIds.map((userId) => ({ id: userId })),
    });
    const notFoundUserIds = userIds.filter(
      (userId) => !userDatas.map((user) => user.id).includes(userId),
    );

    if (notFoundUserIds.length) {
      throw new NotFoundException(`User with id ${notFoundUserIds} not found`);
    }

    return userDatas;
  }
}
