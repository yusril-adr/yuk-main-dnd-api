import { Transform, Type } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  IsUUID,
  Matches,
  MaxLength,
  Min,
  ValidateIf,
} from 'class-validator';
import { IsOptionalNonNull } from '@shared/decorators/is-optional-non-null.decorator';
import { StoryTypeEnum } from '../../../enums/story-type.enum';
import { StoryLocationTypeEnum } from '../../../enums/story-location-type.enum';

// Written out instead of PartialType(CreateStoryInput): PartialType adds
// @IsOptional(), which would let null through to non-nullable columns.
// Omitted fields are left unchanged. status is not part of update.
export class UpdateStoryInput {
  @IsOptionalNonNull()
  @IsString()
  @IsNotEmpty()
  @Matches(/\S/, { message: 'title must not be empty' })
  @MaxLength(150)
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptionalNonNull()
  @IsEnum(StoryTypeEnum)
  type?: StoryTypeEnum;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  gameSystem?: string;

  // Sending null clears the link.
  @IsOptional()
  @IsString()
  @MaxLength(255)
  @IsUrl(
    {
      protocols: ['https'],
      require_protocol: true,
      host_whitelist: [
        'discord.com',
        'www.discord.com',
        'discord.gg',
        'discordapp.com',
        'www.discordapp.com',
      ],
    },
    { message: 'discord_channel_link must be a Discord https link' },
  )
  discordChannelLink?: string | null;

  // Same rule as create (null is stored as 0), without the default.
  @ValidateIf((_, value) => value !== undefined)
  @Type(() => Number)
  @Transform(({ value }: { value: unknown }) => (value === null ? 0 : value))
  @IsInt()
  @Min(0)
  expAwarded?: number;

  @IsOptionalNonNull()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  pointAwarded?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  maxMembers?: number;

  @IsOptional()
  @IsDateString()
  startAt?: string;

  @IsOptionalNonNull()
  @IsEnum(StoryLocationTypeEnum)
  locationType?: StoryLocationTypeEnum;

  @IsOptionalNonNull()
  @IsString()
  @IsNotEmpty()
  locationDetail?: string;

  // Any https link; sending null clears the link.
  @IsOptional()
  @IsString()
  @MaxLength(255)
  @IsUrl(
    { protocols: ['https'], require_protocol: true },
    { message: 'location_link must be an https link' },
  )
  locationLink?: string | null;

  // Any https link to a feedback form; sending null clears the link.
  @IsOptional()
  @IsString()
  @MaxLength(255)
  @IsUrl(
    { protocols: ['https'], require_protocol: true },
    { message: 'feedback_form_link must be an https link' },
  )
  feedbackFormLink?: string | null;

  @IsOptional()
  @IsUUID('4')
  bannerFileId?: string | null;
}
