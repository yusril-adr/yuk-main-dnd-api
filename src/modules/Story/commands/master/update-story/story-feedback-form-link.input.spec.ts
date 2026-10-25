import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { CreateStoryInput } from '../create-story/create-story.input';
import { UpdateStoryInput } from './update-story.input';

const baseCreate = {
  title: 'Feedback smoke',
  type: 1,
  locationType: 1,
  locationDetail: 'Discord',
};

const errorsFor = <T extends object>(
  cls: new () => T,
  body: Record<string, unknown>,
) =>
  validateSync(plainToInstance(cls, body)).filter(
    (error) => error.property === 'feedbackFormLink',
  );

describe('feedbackFormLink validation', () => {
  it.each([
    ['omitted', undefined],
    ['null', null],
    ['a Google Forms link', 'https://forms.gle/abc123'],
    ['any https link', 'https://example.com/feedback'],
  ])('accepts %s on create and update', (_, value) => {
    const body = value === undefined ? {} : { feedbackFormLink: value };
    expect(
      errorsFor(CreateStoryInput, { ...baseCreate, ...body }),
    ).toHaveLength(0);
    expect(errorsFor(UpdateStoryInput, body)).toHaveLength(0);
  });

  it.each([
    ['an http link', 'http://forms.gle/abc123'],
    ['a non-URL', 'not a url'],
    ['a link without protocol', 'forms.gle/abc123'],
    ['a link over 255 characters', `https://example.com/${'a'.repeat(250)}`],
  ])('rejects %s on create and update', (_, value) => {
    const body = { feedbackFormLink: value };
    expect(
      errorsFor(CreateStoryInput, { ...baseCreate, ...body }),
    ).not.toHaveLength(0);
    expect(errorsFor(UpdateStoryInput, body)).not.toHaveLength(0);
  });
});
