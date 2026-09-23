import { Injectable } from '@nestjs/common';
import {
  And,
  Equal,
  FindManyOptions,
  FindOptionsWhere,
  ILike,
} from 'typeorm';
import { camelCase } from 'typeorm/util/StringUtils';
import { Permission } from '@entities/main/iam/permission.entity';
import { mergeWhereConditions } from '@shared/utils/common';
import { PermissionRepository } from './permission.repository';
import { PermissionFilterParamDto } from './dtos/params/permission-filter.param.dto';
import { PermissionPaginateParamDto } from './dtos/params/permission-paginate.param.dto';
import { PermissionEntityDto } from './dtos/results/permission-entity.result.dto';

type PermissionWhere = FindOptionsWhere<Permission>;
type PermissionQuery = PermissionFilterParamDto & { search?: string };

@Injectable()
export class PermissionService {
  constructor(private readonly permissionRepository: PermissionRepository) {}

  async paginate(
    queryDto: PermissionPaginateParamDto,
  ): Promise<[PermissionEntityDto[], number]> {
    let query: FindManyOptions<Permission> = {
      order: {
        [camelCase(queryDto.sortBy)]: queryDto.order,
      },
    };

    query = this.filterQuery(query, queryDto);
    query = this.searchQuery(query, queryDto);

    const permissions = await this.permissionRepository.find({
      ...query,
      take: queryDto.perPage,
      skip: queryDto.perPage * (queryDto.page - 1),
    });
    const count = await this.permissionRepository.count(query);

    return [
      permissions.map((permission) =>
        new PermissionEntityDto().parseEntity(permission),
      ),
      count,
    ];
  }

  async findAll(
    queryDto: PermissionFilterParamDto,
  ): Promise<PermissionEntityDto[]> {
    let query: FindManyOptions<Permission> = {
      order: {
        module: 'ASC',
        action: 'ASC',
        key: 'ASC',
      },
    };

    query = this.filterQuery(query, queryDto);
    query = this.searchQuery(query, queryDto);

    const permissions = await this.permissionRepository.find(query);

    return permissions.map((permission) =>
      new PermissionEntityDto().parseEntity(permission),
    );
  }

  private filterQuery(
    query: FindManyOptions<Permission>,
    queryDto: PermissionQuery,
  ): FindManyOptions<Permission> {
    const filterCondition: PermissionWhere = {};

    if (queryDto.module) {
      filterCondition.module = queryDto.module;
    }

    if (queryDto.action) {
      filterCondition.action = queryDto.action;
    }

    if (Object.keys(filterCondition).length) {
      query.where = filterCondition;
    }

    return query;
  }

  private searchQuery(
    query: FindManyOptions<Permission>,
    queryDto: PermissionQuery,
  ): FindManyOptions<Permission> {
    if (queryDto.search) {
      const searchPattern = `%${queryDto.search}%`;
      const searchCondition: FindOptionsWhere<Permission>[] = [
        {
          key: ILike(searchPattern),
        },
      ];

      query.where = mergeWhereConditions(query.where, ...searchCondition);
    }
  return query;
  }
}
