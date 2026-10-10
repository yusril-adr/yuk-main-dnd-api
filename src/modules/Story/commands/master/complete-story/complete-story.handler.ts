import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Story } from '@entities/main/story/story.entity';
import { StoryMember } from '@entities/main/story/story-member.entity';
import { UserRepository } from '@modules/Iam/User/repositories/user.repository';
import { PermissionEnum } from '@shared/enums/permission.enum';
import { StoryMemberStatusEnum } from '../../../enums/story-member-status.enum';
import { StoryStatusEnum } from '../../../enums/story-status.enum';
import { StoryRepository } from '../../../repositories/story.repository';
import { StoryService } from '../../../services/story.service';
import { StoryPermissionService } from '../../../services/story-permission.service';
import { CompleteStoryCommand } from './complete-story.command';

@CommandHandler(CompleteStoryCommand)
export class CompleteStoryHandler implements ICommandHandler<CompleteStoryCommand> {
  constructor(
    private readonly dataSource: DataSource,
    private readonly storyRepository: StoryRepository,
    private readonly userRepository: UserRepository,
    private readonly storyService: StoryService,
    private readonly storyPermissionService: StoryPermissionService,
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

    this.storyPermissionService.assertCanModify(
      story,
      user,
      PermissionEnum.STORIES_UPDATE,
    );

    if (this.storyService.isCancelledStory(story)) {
      throw new BadRequestException('Cancelled stories cannot be completed');
    }
    if (story.status === StoryStatusEnum.COMPLETED) {
      throw new BadRequestException('Story is already completed');
    }
    if (story.status !== StoryStatusEnum.PUBLISHED) {
      throw new BadRequestException('Only published stories can be completed');
    }

    const uniqueUserIds = [...new Set(params.userIds)];
    if (uniqueUserIds.length > 0) {
      await this.userRepository.findAndValidateUserByIds(uniqueUserIds);
    }
    if (story.maxMembers != null && uniqueUserIds.length > story.maxMembers) {
      throw new BadRequestException(
        `Attended members cannot exceed max members of ${story.maxMembers}`,
      );
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
          : StoryMemberStatusEnum.ABSENT;
      }
      if (members.length) {
        await storyMemberRepo.save(members);
      }

      // TODO: Implement batch XP and point awards for the attended user ids.
      // Credit story.expAwarded and story.pointAwarded only to attended members,
      // inside this transaction. Absent members get nothing. Not implemented yet.
      // TODO: If a DM award is required, update the story creator's DM XP and points
      // inside this same transaction. The DM is story.createdBy. XP must use
      // UserExpLogTypeEnum.DM so it updates dmExp, not playerExp. Points use
      // UserPointLogTypeEnum.INCOME on the shared points balance. There is no
      // separate DM amount column; do not add one in this change. Skip when no DM
      // award is required. Not implemented yet.

      story.status = StoryStatusEnum.COMPLETED;
      story.statusBefore = null;
      await manager.getRepository(Story).save(story);
    });
  }
}
