import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { StoryMember } from '@entities/main/story/story-member.entity';
import { StorageService } from '@modules/Global/services/storage.service';
import dayjs from '@shared/utils/dayjs';
import { StoryRepository } from '../../../repositories/story.repository';
import { GetStoryMembersQuery } from './get-story-members.query';
import {
  GetStoryMembersOutput,
  StoryMemberItemDto,
} from './get-story-members.output';
import { OrderKeyEnum } from '@shared/enums/order.enum';

@QueryHandler(GetStoryMembersQuery)
export class GetStoryMembersHandler implements IQueryHandler<
  GetStoryMembersQuery,
  GetStoryMembersOutput
> {
  constructor(
    private readonly storyRepository: StoryRepository,
    @InjectRepository(StoryMember)
    private readonly storyMemberRepository: Repository<StoryMember>,
    private readonly storageService: StorageService,
  ) {}

  async execute(query: GetStoryMembersQuery): Promise<GetStoryMembersOutput> {
    const { id } = query;

    const story = await this.storyRepository.findOne({ where: { id } });
    if (!story) {
      throw new NotFoundException(`Story with id ${id} not found`);
    }

    // withDeleted keeps a soft-deleted user on the row.
    // find() without it left-joins user and omits that user.
    const members = await this.storyMemberRepository.find({
      where: { story: { id }, deletedAt: IsNull() },
      relations: { user: { avatarFile: true } },
      withDeleted: true,
      order: { createdAt: OrderKeyEnum.ASC, id: OrderKeyEnum.ASC },
    });

    const items: StoryMemberItemDto[] = [];
    for (const member of members) {
      if (member.deletedAt != null || !member.user) {
        continue;
      }
      items.push({
        id: member.id,
        status: member.status,
        createdAt: dayjs(member.createdAt).toISOString(),
        user: {
          id: member.user.id,
          displayName: member.user.deletedAt
            ? `${member.user.displayName} (Deleted User)`
            : member.user.displayName,
          avatarUrl: member.user.avatarFile
            ? this.storageService.getPublicUrlSync(member.user.avatarFile)
            : null,
        },
      });
    }

    return new GetStoryMembersOutput(items);
  }
}
