import { Global, Module } from '@nestjs/common';
import { StorageService } from './services/storage.service';
import { SupabaseClientIntegration } from '@shared/libs/supabase/supabase-client.integration';
import { SupabaseStorageIntegration } from '@shared/libs/supabase/supabase-storage.integration';

@Global()
@Module({
  providers: [StorageService, SupabaseClientIntegration, SupabaseStorageIntegration],
  exports: [StorageService, SupabaseClientIntegration, SupabaseStorageIntegration],
})
export class SharedModule {}
