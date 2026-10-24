import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Story } from '@entities/main/story/story.entity';
import { StoryMember } from '@entities/main/story/story-member.entity';
import { UserRepository } from '@modules/Iam/User/repositories/user.repository';
import { StoryMemberStatusEnum } from '../../enums/story-member-status.enum';
import {
  PUBLIC_STORY_STATUSES,
  StoryStatusEnum,
} from '../../enums/story-status.enum';
import { JoinStoryCommand } from './join-story.command';

@CommandHandler(JoinStoryCommand)
export class JoinStoryHandler implements ICommandHandler<JoinStoryCommand> {
  constructor(
    private readonly dataSource: DataSource,
    private readonly userRepository: UserRepository,
  ) {}

  async execute(command: JoinStoryCommand): Promise<void> {
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
        throw new BadRequestException('Only published stories can be joined');
      }

      const existing = await storyMemberRepo.findOne({
        where: { story: { id }, user: { id: user.id } },
        withDeleted: true,
      });

      if (existing && existing.deletedAt == null) {
        throw new ConflictException(
          `User with id ${user.id} is already a member of this story`,
        );
      }

      if (existing) {
        existing.status = StoryMemberStatusEnum.REGISTERED;
        await storyMemberRepo.recover(existing);
        await storyMemberRepo.save(existing);
        return;
      }

      await storyMemberRepo.save(
        storyMemberRepo.create({
          story: { id },
          user: { id: user.id },
          status: StoryMemberStatusEnum.REGISTERED,
        }),
      );
    });
  }
}
