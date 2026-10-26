import type { TStoryComment } from '@entities/main/story/story-comment.entity';
import { StoryCommentEntityDto } from '@shared/dtos/entities/story/story-comment.entity.dto';

export class PaginateStoryCommentsItemOutput extends StoryCommentEntityDto {
  constructor(payload: TStoryComment, avatarUrl?: string | null) {
    super();
    this.parseEntity(payload, avatarUrl);
  }
}

export class PaginateStoryCommentsOutput {
  public readonly data: PaginateStoryCommentsItemOutput[];
  public readonly count: number;

  constructor(
    comments: TStoryComment[],
    avatarUrls: (string | null)[],
    count: number,
  ) {
    this.data = comments.map(
      (comment, i) =>
        new PaginateStoryCommentsItemOutput(comment, avatarUrls[i]),
    );
    this.count = count;
  }
}
