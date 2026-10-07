import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { Story } from '@entities/main/story/story.entity';

@Injectable()
export class StoryRepository extends Repository<Story> {
  constructor(private readonly dataSource: DataSource) {
    super(Story, dataSource.createEntityManager());
  }
}
