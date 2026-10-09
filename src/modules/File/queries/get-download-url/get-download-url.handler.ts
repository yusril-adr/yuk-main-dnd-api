import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { isUUID } from 'class-validator';
import { StorageService } from '@modules/Global/services/storage.service';
import { FileRepository } from '../../repositories/file.repository';
import { GetDownloadUrlQuery } from './get-download-url.query';
import { GetDownloadUrlOutput } from './get-download-url.output';

@QueryHandler(GetDownloadUrlQuery)
export class GetDownloadUrlHandler implements IQueryHandler<
  GetDownloadUrlQuery,
  GetDownloadUrlOutput
> {
  constructor(
    private readonly fileRepository: FileRepository,
    private readonly storageService: StorageService,
  ) {}

  async execute(query: GetDownloadUrlQuery): Promise<GetDownloadUrlOutput> {
    const { id } = query;

    if (!isUUID(id)) {
      throw new BadRequestException('File id must be a valid UUID');
    }

    const file = await this.fileRepository.findOne({ where: { id } });
    if (!file) {
      throw new NotFoundException(`File with id ${id} not found`);
    }

    const signedUrl = await this.storageService.createSignedUrl(file);

    return GetDownloadUrlOutput.from(file, signedUrl.url);
  }
}
