import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Story } from '@entities/main/story/story.entity';
import { StoryMember } from '@entities/main/story/story-member.entity';
import { UserRepository } from '@modules/Iam/User/repositories/user.repository';
import { UserBalanceService } from '@modules/Iam/User/services/user-balance.service';
import { UserExpLogTypeEnum } from '@shared/enums/user-exp-log-type.enum';
import { UserPointLogTypeEnum } from '@shared/enums/user-point-log-type.enum';
import {
  STORY_DM_EXP_REWARD,
  STORY_PLAYER_EXP_REWARD,
} from '../../../constants/story-reward.constant';
import { StoryMemberStatusEnum } from '../../../enums/story-member-status.enum';
import { StoryStatusEnum } from '../../../enums/story-status.enum';
import { StoryRepository } from '../../../repositories/story.repository';
import { StoryMasterActionService } from '../../../services/story-master-action.service';
import { CompleteStoryCommand } from './complete-story.command';

@CommandHandler(CompleteStoryCommand)
export class CompleteStoryHandler implements ICommandHandler<CompleteStoryCommand> {
  constructor(
    private readonly dataSource: DataSource,
    private readonly storyRepository: StoryRepository,
    private readonly userRepository: UserRepository,
    private readonly storyMasterActionService: StoryMasterActionService,
    private readonly userBalanceService: UserBalanceService,
  ) {}

  async execute(command: CompleteStoryCommand): Promise<void> {
    const { id, params, user } = command;

    const story = await this.storyRepository.findOne({
      where: { id },
      relations: { createdBy: true },
    });
    if (!story) {
      throw new NotFoundException(`Story with id ${id} not found`);
    }

    if (!this.storyMasterActionService.isCanComplete(story, user)) {
      throw new ForbiddenException('Story cannot be completed');
    }

    const uniqueUserIds = [...new Set(params.userIds)];
    if (uniqueUserIds.length === 0) {
      throw new BadRequestException('At least one attended member is required');
    }
    await this.userRepository.findAndValidateUserByIds(uniqueUserIds);
    if (story.maxMembers != null && uniqueUserIds.length > story.maxMembers) {
      throw new BadRequestException(
        `Attended members must not exceed max members of ${story.maxMembers}`,
      );
    }
    if (story.pointAwarded < 0) {
      throw new BadRequestException('Story point award is invalid');
    }

    await this.dataSource.transaction(async (manager) => {
      const storyMemberRepo = manager.getRepository(StoryMember);
      const members = await storyMemberRepo.find({
        where: { story: { id } },
        relations: { user: true },
      });

      const memberUserIds = new Set(members.map((member) => member.user.id));
      const missingIds = uniqueUserIds.filter(
        (userId) => !memberUserIds.has(userId),
      );
      if (missingIds.length) {
        throw new NotFoundException(
          `User with id ${missingIds} is not a member of this story`,
        );
      }

      const attendedUserIds = new Set(uniqueUserIds);
      for (const member of members) {
        member.status = attendedUserIds.has(member.user.id)
          ? StoryMemberStatusEnum.ATTENDED
          : StoryMemberStatusEnum.VIEWER;
      }
      if (members.length) {
        await storyMemberRepo.save(members);
      }

      const rewardDescription = `Player reward for story ${story.title}`;
      await this.userBalanceService.addExperiencePointsToMany(
        {
          userIds: uniqueUserIds,
          type: UserExpLogTypeEnum.PLAYER,
          amount: STORY_PLAYER_EXP_REWARD,
          description: rewardDescription,
        },
        manager,
      );
      if (story.pointAwarded > 0) {
        await this.userBalanceService.addPointsToMany(
          {
            userIds: uniqueUserIds,
            type: UserPointLogTypeEnum.INCOME,
            amount: story.pointAwarded,
            description: rewardDescription,
          },
          manager,
        );
      }

      // The story creator is the DM and gets a fixed DM EXP reward. If the
      // creator also attended, they get the player reward above as well.
      await this.userBalanceService.addExperiencePoints(
        {
          userId: story.createdBy.id,
          type: UserExpLogTypeEnum.DM,
          amount: STORY_DM_EXP_REWARD,
          description: `DM reward for story ${story.title}`,
        },
        manager,
      );

      story.status = StoryStatusEnum.COMPLETED;
      story.statusBefore = null;
      await manager.getRepository(Story).save(story);
    });
  }
}
