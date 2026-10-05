import {
  BadRequestException,
  ConflictException,
  Injectable,
} from '@nestjs/common';
import { randomBytes } from 'crypto';
import { StoryRepository } from '../repositories/story.repository';

const STORY_SLUG_MAX_LENGTH = 180;
const STORY_SLUG_SUFFIX_LENGTH = 6;
const STORY_SLUG_GENERATION_MAX_ATTEMPTS = 10;
const STORY_SLUG_SUFFIX_ALPHABET = 'abcdefghijklmnopqrstuvwxyz0123456789';

@Injectable()
export class StoryService {
  constructor(private readonly storyRepository: StoryRepository) {}

  async generateUniqueSlug(title: string): Promise<string> {
    const baseSlug = this.slugify(title);
    const existingBaseSlug = await this.storyRepository.findOne({
      where: { slug: baseSlug },
      withDeleted: true,
    });

    if (!existingBaseSlug) {
      return baseSlug;
    }

    const maxBaseLength = STORY_SLUG_MAX_LENGTH - STORY_SLUG_SUFFIX_LENGTH - 1;

    for (
      let attempt = 0;
      attempt < STORY_SLUG_GENERATION_MAX_ATTEMPTS;
      attempt++
    ) {
      const suffix = this.generateRandomSuffix();
      const candidateSlug = `${baseSlug.slice(0, maxBaseLength)}-${suffix}`;
      const existingSlug = await this.storyRepository.findOne({
        where: { slug: candidateSlug },
        withDeleted: true,
      });

      if (!existingSlug) {
        return candidateSlug;
      }
    }

    throw new ConflictException('Unable to generate a unique story slug');
  }

  private slugify(title: string): string {
    const slug = title
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, STORY_SLUG_MAX_LENGTH);

    if (!slug) {
      throw new BadRequestException(
        'Story title must contain at least one letter or number',
      );
    }

    return slug;
  }

  private generateRandomSuffix(): string {
    const bytes = randomBytes(STORY_SLUG_SUFFIX_LENGTH);
    return Array.from(bytes, (byte) =>
      STORY_SLUG_SUFFIX_ALPHABET.charAt(
        byte % STORY_SLUG_SUFFIX_ALPHABET.length,
      ),
    ).join('');
  }
}
