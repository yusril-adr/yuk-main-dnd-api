import { randomBytes } from 'crypto';

const SLUG_SUFFIX_LENGTH = 6;
const SLUG_SUFFIX_ALPHABET = 'abcdefghijklmnopqrstuvwxyz0123456789';
const SLUG_GENERATION_MAX_ATTEMPTS = 10;

export type TUniqueSlugOptions = {
  maxLength: number;
  // Used as the base when the text has no ASCII letters or digits
  // (e.g. Devanagari), so slugs stay ASCII.
  fallbackPrefix: string;
  isTaken: (slug: string) => Promise<boolean>;
};

export function slugify(text: string, maxLength: number): string {
  return text
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, maxLength)
    .replace(/-+$/, '');
}

/**
 * Returns the slug of `text` if it is free, otherwise the slug with a random
 * suffix. Returns null when no free slug was found.
 */
export async function generateUniqueSlug(
  text: string,
  options: TUniqueSlugOptions,
): Promise<string | null> {
  const baseSlug = slugify(text, options.maxLength);

  if (baseSlug && !(await options.isTaken(baseSlug))) {
    return baseSlug;
  }

  const maxBaseLength = options.maxLength - SLUG_SUFFIX_LENGTH - 1;
  const prefix = (baseSlug || options.fallbackPrefix).slice(0, maxBaseLength);

  for (let attempt = 0; attempt < SLUG_GENERATION_MAX_ATTEMPTS; attempt++) {
    const candidateSlug = `${prefix}-${generateRandomSuffix()}`;
    if (!(await options.isTaken(candidateSlug))) {
      return candidateSlug;
    }
  }

  return null;
}

function generateRandomSuffix(): string {
  const bytes = randomBytes(SLUG_SUFFIX_LENGTH);
  return Array.from(bytes, (byte) =>
    SLUG_SUFFIX_ALPHABET.charAt(byte % SLUG_SUFFIX_ALPHABET.length),
  ).join('');
}
