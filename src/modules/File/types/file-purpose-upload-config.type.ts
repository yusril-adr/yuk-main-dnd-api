import { FileStatusEnum } from '@modules/shared/enum/file-status.enum';

export type TFilePurposeUploadConfig = {
  bucket: string;
  path: string;
  upsert: boolean;
  maxFileSizeBytes: number;
  status: FileStatusEnum;
};
