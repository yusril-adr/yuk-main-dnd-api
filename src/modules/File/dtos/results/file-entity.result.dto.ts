import type { TFile } from '@entities/main/file.entity';
import dayjs from '@shared/utils/dayjs';

export type TFileEntityDto = Omit<
  TFile,
  'createdAt' | 'updatedAt' | 'deletedAt'
> & {
  createdAt: string;
  updatedAt: string;
};

export class FileEntityDto implements TFileEntityDto {
  id: string;
  name: string;
  bucket: string;
  path: string;
  mimetype: string;
  size: number;
  driver: string;
  url?: string;
  status: string;
  createdAt: string;
  updatedAt: string;

  parseEntity(file: TFile, url?: string): FileEntityDto {
    this.id = file.id;
    this.name = file.name;
    this.bucket = file.bucket;
    this.path = file.path;
    this.mimetype = file.mimetype;
    this.size = file.size;
    this.driver = file.driver;
    if (url) {
      this.url = url;
    }
    this.status = file.status;
    this.createdAt = dayjs(file.createdAt).toISOString();
    this.updatedAt = dayjs(file.updatedAt).toISOString();

    return this;
  }
}
