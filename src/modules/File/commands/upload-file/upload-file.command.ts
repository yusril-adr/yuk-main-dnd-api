import type { TUploadedFile } from '@shared/types/uploaded-file.type';
import { UploadFileInput } from './upload-file.input';

export class UploadFileCommand {
  constructor(
    public readonly file: TUploadedFile,
    public readonly payload: UploadFileInput,
  ) {}
}
