import { Transform } from 'class-transformer';
import { IsEnum, IsJSON, IsOptional } from 'class-validator';
import { FilePurposesEnum } from '@modules/File/enums/file-purposes.enum';

export class UploadFileInput {
  @Transform(({ value }) => Number(value))
  @IsEnum(FilePurposesEnum)
  purpose: FilePurposesEnum;

  @IsOptional()
  @IsJSON()
  metadata?: string;
}