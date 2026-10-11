import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Story } from '@entities/main/story/story.entity';
import { StoryMember } from '@entities/main/story/story-member.entity';
import { UserRepository } from '@modules/Iam/User/repositories/user.repository';
import {
  PUBLIC_STORY_STATUSES,
  StoryStatusEnum,
} from '../../enums/story-status.enum';
import { CancelJoinStoryCommand } from './cancel-join-story.command';

@CommandHandler(CancelJoinStoryCommand)
export class CancelJoinStoryHandler implements ICommandHandler<CancelJoinStoryCommand> {
  constructor(
    private readonly dataSource: DataSource,
    private readonly userRepository: UserRepository,
  ) {}

  async execute(command: CancelJoinStoryCommand): Promise<void> {
    const { id, user } = command;

    await this.userRepository.findAndValidateUserByIds([user.id]);

    await this.dataSource.transaction(async (manager) => {
      const storyRepo = manager.getRepository(Story);
      const storyMemberRepo = manager.getRepository(StoryMember);
      const story = await storyRepo.findOne({ where: { id } });

      if (!story || !PUBLIC_STORY_STATUSES.includes(story.status)) {
        throw new NotFoundException(`Story with id ${id} not found`);
      }

      if (story.status !== StoryStatusEnum.PUBLISHED) {
        throw new BadRequestException('Only published stories can cancel join');
      }

      const existing = await storyMemberRepo.findOne({
        where: { story: { id }, user: { id: user.id } },
      });

      if (!existing) {
        throw new NotFoundException(
          `User with id ${user.id} is not a member of this story`,
        );
      }

      await storyMemberRepo.softRemove(existing);
    });
  }
}
