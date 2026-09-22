import { SetMetadata } from '@nestjs/common';
import { ConfigEnum } from '@shared/enums/config.enum';

export const Deprecated = () => SetMetadata(ConfigEnum.DEPRECATED_KEY, true);
