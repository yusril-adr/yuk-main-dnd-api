import { PartialType } from '@nestjs/mapped-types';
import { RoleCreateParamDto } from './role-create.param.dto';

export class RoleUpdateParamDto extends PartialType(RoleCreateParamDto) {}
