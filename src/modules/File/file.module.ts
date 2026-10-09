import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CqrsModule } from '@nestjs/cqrs';
import { File as FileEntity } from '@entities/main/file.entity';
import { FileController } from './controllers/file.controller';
import { FileRepository } from './repositories/file.repository';
import { FilePurposeService } from './services/file-purpose.service';
import { UploadFileHandler } from './commands/upload-file/upload-file.handler';
import { RemoveFileHandler } from './commands/remove-file/remove-file.handler';
import { GetDownloadUrlHandler } from './queries/get-download-url/get-download-url.handler';

const commandHandlers = [UploadFileHandler, RemoveFileHandler];
const queryHandlers = [GetDownloadUrlHandler];

@Module({
  imports: [TypeOrmModule.forFeature([FileEntity]), CqrsModule],
  controllers: [FileController],
  providers: [
    FileRepository,
    FilePurposeService,
    ...commandHandlers,
    ...queryHandlers,
  ],
  exports: [FileRepository],
})
export class FileModule {}
