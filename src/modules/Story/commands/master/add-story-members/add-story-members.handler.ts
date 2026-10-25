import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { DataSource, IsNull } from 'typeorm';
import { StoryMember } from '@entities/main/story/story-member.entity';
import { UserRepository } from '@modules/Iam/User/repositories/user.repository';
import { StoryMemberStatusEnum } from '../../../enums/story-member-status.enum';
import { StoryRepository } from '../../../repositories/story.repository';
import { StoryMasterActionService } from '../../../services/story-master-action.service';
import { AddStoryMembersCommand } from './add-story-members.command';

@CommandHandler(AddStoryMembersCommand)
export class AddStoryMembersHandler implements ICommandHandler<AddStoryMembersCommand> {
  constructor(
    private readonly dataSource: DataSource,
    private readonly storyRepository: StoryRepository,
    private readonly userRepository: UserRepository,
    private readonly storyMasterActionService: StoryMasterActionService,
  ) {}

  async execute(command: AddStoryMembersCommand): Promise<void> {
    const { id, params, user } = command;

    const story = await this.storyRepository.findOne({
      where: { id },
      relations: { createdBy: true },
    });
    if (!story) {
      throw new NotFoundException(`Story with id ${id} not found`);
    }

    if (!this.storyMasterActionService.isCanAddMembers(story, user)) {
      throw new ForbiddenException('Story members cannot be added');
    }

    const uniqueUserIds = [...new Set(params.userIds)];
    await this.userRepository.findAndValidateUserByIds(uniqueUserIds);

    await this.dataSource.transaction(async (manager) => {
      const storyMemberRepo = manager.getRepository(StoryMember);
      const existingMembers = await storyMemberRepo.find({
        where: uniqueUserIds.map((userId) => ({
          story: { id },
          user: { id: userId },
          deletedAt: IsNull(),
        })),
        relations: { user: true },
        withDeleted: true,
      });

      const activeMembers = existingMembers.filter(
        (member) => member.deletedAt == null,
      );
      if (activeMembers.length) {
        const activeMemberIds = activeMembers.map((member) => member.user.id);
        throw new ConflictException(
          `User with id ${activeMemberIds} is already a member of this story`,
        );
      }

      const softDeletedMembers = existingMembers.filter(
        (member) => member.deletedAt != null,
      );
      if (softDeletedMembers.length) {
        for (const member of softDeletedMembers) {
          member.status = StoryMemberStatusEnum.REGISTERED;
        }
        await storyMemberRepo.recover(softDeletedMembers);
        await storyMemberRepo.save(softDeletedMembers);
      }

      const existingUserIds = new Set(
        existingMembers.map((member) => member.user.id),
      );
      const newMembers = uniqueUserIds
        .filter((userId) => !existingUserIds.has(userId))
        .map((userId) =>
          storyMemberRepo.create({
            story: { id },
            user: { id: userId },
            status: StoryMemberStatusEnum.REGISTERED,
          }),
        );
      if (newMembers.length) {
        await storyMemberRepo.save(newMembers);
      }
    });
  }
}
