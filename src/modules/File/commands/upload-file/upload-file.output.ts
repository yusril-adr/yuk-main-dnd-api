import type { TFile } from '@entities/main/file.entity';
import { FileEntityDto } from '@shared/dtos/entities/file.entity.dto';

export class UploadFileOutput {
  constructor(public readonly data: FileEntityDto) {}

  static from(file: TFile): UploadFileOutput {
    return new UploadFileOutput(new FileEntityDto().parseEntity(file));
  }
}