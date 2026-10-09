import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { isUUID } from 'class-validator';
import { File as FileEntity } from '@entities/main/file.entity';
import { StorageService } from '@modules/Global/services/storage.service';
import { FileRepository } from '../../repositories/file.repository';
import { RemoveFileCommand } from './remove-file.command';

@CommandHandler(RemoveFileCommand)
export class RemoveFileHandler implements ICommandHandler<RemoveFileCommand> {
  constructor(
    private readonly dataSource: DataSource,
    private readonly fileRepository: FileRepository,
    private readonly storageService: StorageService,
  ) {}

  async execute(command: RemoveFileCommand): Promise<void> {
    const { id } = command;

    if (!isUUID(id)) {
      throw new BadRequestException('File id must be a valid UUID');
    }

    const file = await this.fileRepository.findOne({ where: { id } });
    if (!file) {
      throw new NotFoundException(`File with id ${id} not found`);
    }

    await this.storageService.delete(file);

    await this.dataSource.transaction(async (manager) => {
      const fileRepo = manager.getRepository(FileEntity);
      await fileRepo.softDelete(id);
    });
  }
}
