import { IsEnum, IsJSON, IsOptional } from 'class-validator';
import { FilePurposesEnum } from '@modules/File/enums/file-purposes.enum';

export class UploadFileInput {
  @IsEnum(FilePurposesEnum)
  purpose: FilePurposesEnum;

  @IsOptional()
  @IsJSON()
  metadata?: string;
}