import { ValidationPipe, VersioningType } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { Test } from '@nestjs/testing';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import request from 'supertest';
import { RequestInterceptor } from '@shared/interceptors/request.interceptor';
import { ResponseInterceptor } from '@shared/interceptors/response.interceptor';
import { MasterRoleController } from './master-role.controller';
import { PaginateRoleOptionsInput } from '../queries/master/paginate-role-options/paginate-role-options.input';
import { PaginateRoleOptionsQuery } from '../queries/master/paginate-role-options/paginate-role-options.query';

const GUILD_MASTER_ID = '6d9f0c1e-7b2a-4e5d-9c31-1a2b3c4d5e6f';

describe('GET /api/v1/master/iam/roles/options', () => {
  async function createApp(execute: jest.Mock) {
    const moduleRef = await Test.createTestingModule({
      controllers: [MasterRoleController],
      providers: [
        { provide: CommandBus, useValue: { execute: jest.fn() } },
        { provide: QueryBus, useValue: { execute } },
      ],
    }).compile();

    const app = moduleRef.createNestApplication();
    app.enableVersioning({ type: VersioningType.URI });
    app.setGlobalPrefix('api');
    app.useGlobalInterceptors(
      new RequestInterceptor(),
      new ResponseInterceptor(),
    );
    app.useGlobalPipes(new ValidationPipe({ transform: true }));
    await app.init();
    return app;
  }

  it('returns a page of id and name for the user-list filter', async () => {
    const execute = jest.fn().mockResolvedValue({
      data: [{ id: GUILD_MASTER_ID, name: 'Guild Master' }],
      count: 1,
    });
    const app = await createApp(execute);

    const response = await request(app.getHttpServer())
      .get('/api/v1/master/iam/roles/options')
      .query({ search: 'Guild', page: 1, per_page: 10, sort_by: 'name' });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      status_code: 200,
      message: 'Role options retrieved successfully',
      data: {
        meta: {
          total_all_data: 1,
          total_view: 1,
          max_view: 10,
          current_page: 1,
          total_page: 1,
        },
        items: [{ id: GUILD_MASTER_ID, name: 'Guild Master' }],
      },
    });
    const dispatched = execute.mock.calls[0][0] as PaginateRoleOptionsQuery;
    expect(dispatched).toBeInstanceOf(PaginateRoleOptionsQuery);
    expect(dispatched.params.search).toBe('Guild');
    expect(dispatched.params.page).toBe(1);
    expect(dispatched.params.perPage).toBe(10);
    expect(dispatched.params.sortBy).toBe('name');
    expect(dispatched.params.order).toBe('asc');

    await app.close();
  });

  it('rejects a sort column the dropdown does not return', async () => {
    const params = plainToInstance(PaginateRoleOptionsInput, {
      sortBy: 'updated_at',
    });
    const errors = await validate(params);

    expect(
      errors.map((error) => ({
        property: error.property,
        constraints: error.constraints,
      })),
    ).toEqual([
      {
        property: 'sortBy',
        constraints: {
          isIn: 'sortBy must be one of the following values: name',
        },
      },
    ]);
  });
});
