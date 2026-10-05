import { Global, Module } from '@nestjs/common';
import { StorageService } from './services/storage.service';
import { SupabaseClientIntegration } from '@shared/libs/supabase/supabase-client.integration';
import { SupabaseStorageIntegration } from '@shared/libs/supabase/supabase-storage.integration';
import { UserAvatarPathService } from './services/user-avatar-path.service';
import { StoryBannerPathService } from './services/story-banner-path.service';

@Global()
@Module({
  providers: [
    StorageService,
    SupabaseClientIntegration,
    SupabaseStorageIntegration,
    UserAvatarPathService,
    StoryBannerPathService,
  ],
  exports: [
    StorageService,
    SupabaseClientIntegration,
    SupabaseStorageIntegration,
    UserAvatarPathService,
    StoryBannerPathService,
  ],
})
export class GlobalModule {}
