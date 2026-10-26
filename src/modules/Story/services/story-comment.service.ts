import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { isUUID } from 'class-validator';
import { EntityManager, Repository } from 'typeorm';
import { Story } from '@entities/main/story/story.entity';
import { StoryComment } from '@entities/main/story/story-comment.entity';
import { StoryRepository } from '../repositories/story.repository';

@Injectable()
export class StoryCommentService {
  constructor(
    private readonly storyRepository: StoryRepository,
    @InjectRepository(StoryComment)
    private readonly storyCommentRepository: Repository<StoryComment>,
  ) {}

  async findStoryOrFail(storyId: string): Promise<Story> {
    const story = isUUID(storyId)
      ? await this.storyRepository.findOne({
          where: { id: storyId },
          relations: { createdBy: true },
        })
      : null;
    if (!story) {
      throw new NotFoundException(`Story with id ${storyId} not found`);
    }
    return story;
  }

  async findCommentOrFail(
    storyId: string,
    commentId: string,
    manager?: EntityManager,
  ): Promise<StoryComment> {
    const repository = manager
      ? manager.getRepository(StoryComment)
      : this.storyCommentRepository;
    const comment = isUUID(commentId)
      ? await repository.findOne({
          where: { id: commentId, story: { id: storyId } },
          relations: { user: true },
        })
      : null;
    if (!comment) {
      throw new NotFoundException(`Comment with id ${commentId} not found`);
    }
    return comment;
  }
}
