import { PartialType } from '@nestjs/mapped-types';
import { UserCreateParamDto } from './user-create.param.dto';

export class UserUpdateParamDto extends PartialType(UserCreateParamDto) {}
