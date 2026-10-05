import { PartialType } from '@nestjs/mapped-types';
import { CreateStoryInput } from '../create-story/create-story.input';

export class UpdateStoryInput extends PartialType(CreateStoryInput) {}
