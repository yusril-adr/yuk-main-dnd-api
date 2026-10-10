export enum StoryStatusEnum {
  DRAFT = 1,
  PUBLISHED = 2,
  ARCHIVED = 3,
  CANCELLED = 4,
  COMPLETED = 5,
}

export const PUBLIC_STORY_STATUSES = [
  StoryStatusEnum.PUBLISHED,
  StoryStatusEnum.COMPLETED,
];
