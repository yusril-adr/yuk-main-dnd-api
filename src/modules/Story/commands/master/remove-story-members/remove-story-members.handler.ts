import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { StoryMember } from '@entities/main/story/story-member.entity';
import { UserRepository } from '@modules/Iam/User/repositories/user.repository';
import { StoryRepository } from '../../../repositories/story.repository';
import { StoryMasterActionService } from '../../../services/story-master-action.service';
import { RemoveStoryMembersCommand } from './remove-story-members.command';

@CommandHandler(RemoveStoryMembersCommand)
export class RemoveStoryMembersHandler implements ICommandHandler<RemoveStoryMembersCommand> {
  constructor(
    private readonly dataSource: DataSource,
    private readonly storyRepository: StoryRepository,
    private readonly userRepository: UserRepository,
    private readonly storyMasterActionService: StoryMasterActionService,
  ) {}

  async execute(command: RemoveStoryMembersCommand): Promise<void> {
    const { id, params, user } = command;

    const story = await this.storyRepository.findOne({
      where: { id },
      relations: { createdBy: true },
    });
    if (!story) {
      throw new NotFoundException(`Story with id ${id} not found`);
    }

    if (!this.storyMasterActionService.isCanRemoveMembers(story, user)) {
      throw new ForbiddenException('Story members cannot be removed');
    }

    const uniqueUserIds = [...new Set(params.userIds)];
    await this.userRepository.findAndValidateUserByIds(uniqueUserIds);

    await this.dataSource.transaction(async (manager) => {
      const storyMemberRepo = manager.getRepository(StoryMember);
      const members = await storyMemberRepo.find({
        where: uniqueUserIds.map((userId) => ({
          story: { id },
          user: { id: userId },
        })),
        relations: { user: true },
      });

      const foundUserIds = new Set(members.map((member) => member.user.id));
      const missingIds = uniqueUserIds.filter(
        (userId) => !foundUserIds.has(userId),
      );
      if (missingIds.length) {
        throw new NotFoundException(
          `User with id ${missingIds} is not a member of this story`,
        );
      }

      await storyMemberRepo.softRemove(members);
    });
  }
}
