export type TStorageUploadOptions = {
  bucket: string;
  path: string;
  upsert: boolean;
};

export type TStorageMoveOptions = {
  bucket: string;
  path: string;
};
