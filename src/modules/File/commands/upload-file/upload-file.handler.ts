import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { BadRequestException, PayloadTooLargeException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { File as FileEntity } from '@entities/main/file.entity';
import { StorageService } from '@modules/Global/services/storage.service';
import { FilePurposeService } from '../../services/file-purpose.service';
import { FilePurposesEnum } from '../../enums/file-purposes.enum';
import { UploadFileCommand } from './upload-file.command';
import { UploadFileOutput } from './upload-file.output';

@CommandHandler(UploadFileCommand)
export class UploadFileHandler implements ICommandHandler<
  UploadFileCommand,
  UploadFileOutput
> {
  constructor(
    private readonly dataSource: DataSource,
    private readonly storageService: StorageService,
    private readonly filePurposeService: FilePurposeService,
  ) {}

  async execute(command: UploadFileCommand): Promise<UploadFileOutput> {
    const { file, payload } = command;

    if (!file) {
      throw new BadRequestException('A file is required');
    }

    this.validateMetadata(payload.purpose, payload.metadata);
    const purposeConfig = this.filePurposeService.resolveUploadConfig(
      payload.purpose,
      file.originalname,
    );

    if (file.size > purposeConfig.maxFileSizeBytes) {
      throw new PayloadTooLargeException(
        `File size must not exceed ${purposeConfig.maxFileSizeBytes} bytes for purpose '${payload.purpose}'`,
      );
    }

    const storageFile = await this.storageService.upload(file, {
      bucket: purposeConfig.bucket,
      path: purposeConfig.path,
      upsert: purposeConfig.upsert,
    });

    const savedFile = await this.dataSource.transaction(async (manager) => {
      const fileRepo = manager.getRepository(FileEntity);
      return fileRepo.save(
        fileRepo.create({
          name: file.originalname,
          bucket: storageFile.bucket,
          path: storageFile.path,
          size: file.size,
          mimetype: file.mimetype,
          driver: storageFile.driver,
          status: purposeConfig.status,
        }),
      );
    });

    return UploadFileOutput.from(savedFile);
  }

  private validateMetadata(purpose: number, metadata?: string): void {
    if (!metadata) {
      return;
    }

    let parsedMetadata: unknown;
    try {
      parsedMetadata = JSON.parse(metadata);
    } catch {
      throw new BadRequestException('metadata must be valid JSON');
    }

    if (
      !parsedMetadata ||
      typeof parsedMetadata !== 'object' ||
      Array.isArray(parsedMetadata)
    ) {
      throw new BadRequestException('metadata must be a JSON object');
    }

    if (
      purpose === FilePurposesEnum.USER_AVATAR &&
      Object.prototype.hasOwnProperty.call(parsedMetadata, 'target_id')
    ) {
      throw new BadRequestException('metadata.target_id is not supported');
    }
  }
}
