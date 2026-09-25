import { Global, Module } from '@nestjs/common';
import { StorageService } from './services/storage.service';
import { SupabaseClientIntegration } from '@shared/libs/supabase/supabase-client.integration';
import { SupabaseStorageIntegration } from '@shared/libs/supabase/supabase-storage.integration';
import { UserAvatarPathService } from './services/user-avatar-path.service';

@Global()
@Module({
  providers: [
    StorageService,
    SupabaseClientIntegration,
    SupabaseStorageIntegration,
    UserAvatarPathService,
  ],
  exports: [
    StorageService,
    SupabaseClientIntegration,
    SupabaseStorageIntegration,
    UserAvatarPathService,
  ],
})
export class SharedModule {}
