export type TFilePurposeUploadConfig = {
  bucket: string;
  path: string;
  upsert: boolean;
  maxFileSizeBytes: number;
};
