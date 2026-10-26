import { OmitType } from '@nestjs/mapped-types';
import { CreateStoryCommentInput } from '../create-story-comment/create-story-comment.input';

// Replies can't be moved, so the parent is fixed at creation.
export class UpdateStoryCommentInput extends OmitType(CreateStoryCommentInput, [
  'parentId',
] as const) {}
