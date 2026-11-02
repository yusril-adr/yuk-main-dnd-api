import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { DataSource, EntityManager, In } from 'typeorm';
import { User } from '@entities/main/iam/user.entity';
import { UserExpLog } from '@entities/main/iam/user-exp-log.entity';
import { UserPointLog } from '@entities/main/iam/user-point-log.entity';
import { StoryMember } from '@entities/main/story/story-member.entity';
import { StoryComment } from '@entities/main/story/story-comment.entity';
import { StoryCommentReaction } from '@entities/main/story/story-comment-reaction.entity';
import { StoryMemberStatusEnum } from '@modules/Story/enums/story-member-status.enum';
import { UserBalanceService } from '../../../services/user-balance.service';
import { UserRepository } from '../../../repositories/user.repository';
import { LinkGuestUserCommand } from './link-guest-user.command';

@CommandHandler(LinkGuestUserCommand)
export class LinkGuestUserHandler implements ICommandHandler<
  LinkGuestUserCommand,
  User
> {
  constructor(
    private readonly dataSource: DataSource,
    private readonly userRepository: UserRepository,
    private readonly userBalanceService: UserBalanceService,
  ) {}

  async execute(command: LinkGuestUserCommand): Promise<User> {
    const { guestId, params } = command;
    const targetUserId = params.userId;

    if (guestId === targetUserId) {
      throw new BadRequestException('Cannot link a guest to itself');
    }

    const guest = await this.userRepository.findOne({
      where: { id: guestId },
    });
    if (!guest) {
      throw new NotFoundException(`User with id ${guestId} not found`);
    }
    if (!guest.isGuest) {
      throw new BadRequestException(`User with id ${guestId} is not a guest`);
    }

    const target = await this.userRepository.findOne({
      where: { id: targetUserId },
    });
    if (!target) {
      throw new NotFoundException(`User with id ${targetUserId} not found`);
    }
    if (target.isGuest) {
      throw new BadRequestException(
        'Cannot link a guest into another guest user',
      );
    }

    await this.dataSource.transaction(async (manager) => {
      await this.moveStoryMembers(manager, guestId, targetUserId);
      await this.moveLogs(manager, guestId, targetUserId);
      await this.moveComments(manager, guestId, targetUserId);
      await this.moveReactions(manager, guestId, targetUserId);

      await this.userBalanceService.recomputeBalancesFromLogs(
        targetUserId,
        manager,
      );

      const userRepo = manager.getRepository(User);
      const guestEntity = await userRepo.findOne({
        where: { id: guestId },
        lock: { mode: 'pessimistic_write' },
      });
      if (!guestEntity) {
        throw new NotFoundException(`User with id ${guestId} not found`);
      }
      guestEntity.mergedIntoUser = { id: targetUserId } as User;
      await userRepo.save(guestEntity);
      await userRepo.softDelete(guestId);
    });

    const updated = await this.userRepository.findOne({
      where: { id: targetUserId },
      relations: {
        userRoles: { role: true },
        avatarFile: true,
      },
    });
    return updated!;
  }

  private async moveStoryMembers(
    manager: EntityManager,
    guestId: string,
    targetUserId: string,
  ): Promise<void> {
    const memberRepo = manager.getRepository(StoryMember);
    const guestMembers = await memberRepo.find({
      where: { user: { id: guestId } },
      relations: { story: true, user: true },
    });
    if (!guestMembers.length) {
      return;
    }

    const storyIds = guestMembers.map((member) => member.story.id);
    const targetMembers = await memberRepo.find({
      where: {
        user: { id: targetUserId },
        story: { id: In(storyIds) },
      },
      relations: { story: true, user: true },
    });
    const targetByStoryId = new Map(
      targetMembers.map((member) => [member.story.id, member]),
    );

    const toSave: StoryMember[] = [];
    const toSoftDelete: string[] = [];

    for (const guestMember of guestMembers) {
      const existing = targetByStoryId.get(guestMember.story.id);
      if (existing) {
        if (
          guestMember.status === StoryMemberStatusEnum.ATTENDED ||
          existing.status === StoryMemberStatusEnum.ATTENDED
        ) {
          existing.status = StoryMemberStatusEnum.ATTENDED;
          toSave.push(existing);
        }
        toSoftDelete.push(guestMember.id);
      } else {
        guestMember.user = { id: targetUserId } as User;
        toSave.push(guestMember);
      }
    }

    if (toSave.length) {
      await memberRepo.save(toSave);
    }
    if (toSoftDelete.length) {
      await memberRepo.softDelete(toSoftDelete);
    }
  }

  private async moveLogs(
    manager: EntityManager,
    guestId: string,
    targetUserId: string,
  ): Promise<void> {
    await manager
      .getRepository(UserExpLog)
      .createQueryBuilder()
      .update(UserExpLog)
      .set({ user: { id: targetUserId } })
      .where('user_id = :guestId', { guestId })
      .execute();

    await manager
      .getRepository(UserPointLog)
      .createQueryBuilder()
      .update(UserPointLog)
      .set({ user: { id: targetUserId } })
      .where('user_id = :guestId', { guestId })
      .execute();
  }

  private async moveComments(
    manager: EntityManager,
    guestId: string,
    targetUserId: string,
  ): Promise<void> {
    await manager
      .getRepository(StoryComment)
      .createQueryBuilder()
      .update(StoryComment)
      .set({ user: { id: targetUserId } })
      .where('user_id = :guestId', { guestId })
      .execute();
  }

  private async moveReactions(
    manager: EntityManager,
    guestId: string,
    targetUserId: string,
  ): Promise<void> {
    const reactionRepo = manager.getRepository(StoryCommentReaction);
    const guestReactions = await reactionRepo.find({
      where: { user: { id: guestId } },
      relations: { comment: true, user: true },
    });
    if (!guestReactions.length) {
      return;
    }

    const commentIds = guestReactions.map((reaction) => reaction.comment.id);
    const targetReactions = await reactionRepo.find({
      where: {
        user: { id: targetUserId },
        comment: { id: In(commentIds) },
      },
      relations: { comment: true },
    });
    const targetCommentIds = new Set(
      targetReactions.map((reaction) => reaction.comment.id),
    );

    const toDelete: string[] = [];
    const toMove: StoryCommentReaction[] = [];
    for (const reaction of guestReactions) {
      if (targetCommentIds.has(reaction.comment.id)) {
        // Keep the real user's reaction; drop the guest's duplicate.
        toDelete.push(reaction.id);
      } else {
        reaction.user = { id: targetUserId } as User;
        toMove.push(reaction);
      }
    }

    if (toDelete.length) {
      await reactionRepo.delete(toDelete);
    }
    if (toMove.length) {
      await reactionRepo.save(toMove);
    }
  }
}
