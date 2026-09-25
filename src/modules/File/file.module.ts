import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserModule } from '@modules/Master/Iam/User/user.module';
import { File as FileEntity } from '@entities/main/file.entity';
import { StorageService } from '@modules/shared/services/storage.service';
import { FileController } from './file.controller';
import { FileService } from './file.service';
import { FilePurposeService } from './services/file-purpose.service';

@Module({
  imports: [TypeOrmModule.forFeature([FileEntity]), UserModule],
  controllers: [FileController],
  providers: [
    FileService,
    FilePurposeService,
  ],
  exports: [FileService],
})
export class FileModule {}
