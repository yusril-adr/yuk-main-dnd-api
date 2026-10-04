import type { TFile } from '@entities/main/file.entity';
import { FileEntityDto } from '@shared/dtos/entities/file.entity.dto';

export class GetDownloadUrlOutput {
  constructor(public readonly data: FileEntityDto) {}

  static from(file: TFile, url?: string): GetDownloadUrlOutput {
    return new GetDownloadUrlOutput(new FileEntityDto().parseEntity(file, url));
  }
}