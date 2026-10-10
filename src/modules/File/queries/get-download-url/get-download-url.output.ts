import type { TFile } from '@entities/main/file.entity';
import { FileEntityDto } from '@shared/dtos/entities/file.entity.dto';

export class GetDownloadUrlOutput extends FileEntityDto {
  constructor(payload: TFile, url?: string) {
    super();
    this.parseEntity(payload, url);
  }
}
