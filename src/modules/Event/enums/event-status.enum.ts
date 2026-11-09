export enum EventStatusEnum {
  DRAFT = 1,
  PUBLISHED = 2,
  ARCHIVED = 3,
  CANCELLED = 4,
  COMPLETED = 5,
}

export const PUBLIC_EVENT_STATUSES = [
  EventStatusEnum.PUBLISHED,
  EventStatusEnum.COMPLETED,
];
