import {
  BadRequestException,
  Injectable,
  NotFoundException,
  PayloadTooLargeException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { isUUID } from 'class-validator';
import { Repository } from 'typeorm';
import { File as FileEntity } from '@entities/main/file.entity';
import { FilePurposesEnum } from './enums/file-purposes.enum';
import { FilePurposeService } from './services/file-purpose.service';
import { StorageService } from '@modules/Global/services/storage.service';
import type { TUploadedFile } from '@shared/types/uploaded-file.type';
import { FileEntityDto } from './dtos/results/file-entity.result.dto';

@Injectable()
export class FileService {
  constructor(
    @InjectRepository(FileEntity)
    private readonly fileRepository: Repository<FileEntity>,
    private readonly storageService: StorageService,
    private readonly filePurposeService: FilePurposeService,
  ) {}

  async upload(
    file: TUploadedFile | undefined,
    purpose: FilePurposesEnum,
    metadata: string | undefined,
  ): Promise<FileEntityDto> {
    if (!file) {
      throw new BadRequestException('A file is required');
    }

    this.validateMetadata(purpose, metadata);
    const purposeConfig = this.filePurposeService.resolveUploadConfig(
      purpose,
      file.originalname,
    );

    if (file.size > purposeConfig.maxFileSizeBytes) {
      throw new PayloadTooLargeException(
        `File size must not exceed ${purposeConfig.maxFileSizeBytes} bytes for purpose '${purpose}'`,
      );
    }

    const storageFile = await this.storageService.upload(file, {
      bucket: purposeConfig.bucket,
      path: purposeConfig.path,
      upsert: purposeConfig.upsert,
    });

    const savedFile = await this.fileRepository.save(
      this.fileRepository.create({
        name: file.originalname,
        bucket: storageFile.bucket,
        path: storageFile.path,
        size: file.size,
        mimetype: file.mimetype,
        driver: storageFile.driver,
        status: purposeConfig.status,
      }),
    );

    return new FileEntityDto().parseEntity(savedFile);
  }

  async getDownloadUrl(id: string): Promise<FileEntityDto> {
    if (!isUUID(id)) {
      throw new BadRequestException('File id must be a valid UUID');
    }

    const file = await this.fileRepository.findOne({ where: { id } });
    if (!file) {
      throw new NotFoundException(`File with id ${id} not found`);
    }

    const signedUrl = await this.storageService.createSignedUrl(file);

    return new FileEntityDto().parseEntity(file, signedUrl.url);
  }

  async remove(id: string): Promise<void> {
    if (!isUUID(id)) {
      throw new BadRequestException('File id must be a valid UUID');
    }

    const file = await this.fileRepository.findOne({ where: { id } });
    if (!file) {
      throw new NotFoundException(`File with id ${id} not found`);
    }

    await this.storageService.delete(file);
    await this.fileRepository.softDelete(id);
  }

  private validateMetadata(purpose: FilePurposesEnum, metadata?: string): void {
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
