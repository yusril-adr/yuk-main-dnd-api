import { SetMetadata } from '@nestjs/common';
import { ConfigEnum } from '@shared/enums/config.enum';

export const Public = () => SetMetadata(ConfigEnum.IS_PUBLIC_KEY, true);
