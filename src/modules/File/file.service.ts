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
import type { FilePurposesEnum } from './enums/file-purposes.enum';
import { FilePurposeService } from './services/file-purpose.service';
import type { TFileUploadMetadata } from './types/file-upload-metadata.type';
import { StorageService } from '@modules/shared/services/storage.service';
import { TJWTPayload } from '@shared/types/jwt-payload.type';
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
    currentUser: TJWTPayload,
  ): Promise<FileEntityDto> {
    if (!file) {
      throw new BadRequestException('A file is required');
    }

    const parsedMetadata = this.parseMetadata(metadata);
    const purposeConfig = await this.filePurposeService.resolveUploadConfig(
      purpose,
      parsedMetadata,
      currentUser,
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

  private parseMetadata(metadata?: string): TFileUploadMetadata {
    if (!metadata) {
      return {};
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

    const targetId = (parsedMetadata as Record<string, unknown>).target_id;
    if (targetId !== undefined && typeof targetId !== 'string') {
      throw new BadRequestException('metadata.target_id must be a string');
    }

    if (targetId !== undefined && !isUUID(targetId)) {
      throw new BadRequestException('metadata.target_id must be a valid UUID');
    }

    return { targetId };
  }
}
