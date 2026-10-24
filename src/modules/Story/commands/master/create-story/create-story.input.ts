import { Type } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsIn,
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
import { StoryStatusEnum } from '../../../enums/story-status.enum';
import { StoryTypeEnum } from '../../../enums/story-type.enum';
import { StoryLocationTypeEnum } from '../../../enums/story-location-type.enum';

export class CreateStoryInput {
  @IsString()
  @IsNotEmpty()
  @Matches(/[A-Za-z0-9]/, {
    message: 'title must contain at least one letter or number',
  })
  @MaxLength(150)
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsIn([StoryStatusEnum.DRAFT, StoryStatusEnum.PUBLISHED])
  status?: StoryStatusEnum;

  @IsEnum(StoryTypeEnum)
  type: StoryTypeEnum;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  gameSystem?: string;

  // Optional; sending null on update clears the link.
  @ValidateIf((_, value) => value !== undefined && value !== null)
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

  @IsOptional()
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

  @IsEnum(StoryLocationTypeEnum)
  locationType: StoryLocationTypeEnum;

  @IsString()
  @IsNotEmpty()
  locationDetail: string;

  // Any https link (Google Maps, Apple Maps, Waze, ...); independent of
  // locationType. Sending null on update clears the link.
  @ValidateIf((_, value) => value !== undefined && value !== null)
  @IsString()
  @MaxLength(255)
  @IsUrl(
    { protocols: ['https'], require_protocol: true },
    { message: 'location_link must be an https link' },
  )
  locationLink?: string | null;

  @IsOptional()
  @IsUUID('4')
  bannerFileId?: string | null;
}
