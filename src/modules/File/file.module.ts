import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserModule } from '@modules/Master/Iam/User/user.module';
import { File as FileEntity } from '@entities/main/file.entity';
import { SupabaseClientIntegration } from '@shared/libs/supabase/supabase-client.integration';
import { SupabaseStorageIntegration } from '@shared/libs/supabase/supabase-storage.integration';
import { StorageService } from '@shared/services/storage.service';
import { FileController } from './file.controller';
import { FileService } from './file.service';
import { FilePurposeService } from './services/file-purpose.service';

@Module({
  imports: [TypeOrmModule.forFeature([FileEntity]), UserModule],
  controllers: [FileController],
  providers: [
    FileService,
    FilePurposeService,
    StorageService,
    SupabaseClientIntegration,
    SupabaseStorageIntegration,
  ],
  exports: [FileService, StorageService],
})
export class FileModule {}
