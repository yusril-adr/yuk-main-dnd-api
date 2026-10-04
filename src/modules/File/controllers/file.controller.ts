import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Body,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import * as wrapper from '@shared/utils/wrapper';
import { Public } from '@shared/decorators/public.decorator';
import type { TUploadedFile } from '@shared/types/uploaded-file.type';
import { UploadFileCommand } from '../commands/upload-file/upload-file.command';
import { UploadFileInput } from '../commands/upload-file/upload-file.input';
import { GetDownloadUrlQuery } from '../queries/get-download-url/get-download-url.query';

@Controller({
  path: 'files',
  version: '1',
})
export class FileController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Post('upload')
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(FileInterceptor('file'))
  async upload(
    @Body() payload: UploadFileInput,
    @UploadedFile() file?: TUploadedFile,
  ) {
    const output = await this.commandBus.execute(
      new UploadFileCommand(file!, payload),
    );

    return wrapper.response({
      statusCode: HttpStatus.CREATED,
      data: output.data,
      message: 'File uploaded successfully',
    });
  }

  @Get('download/:id')
  @Public()
  async download(@Param('id') id: string) {
    const output = await this.queryBus.execute(new GetDownloadUrlQuery(id));

    return wrapper.response({
      data: output.data,
      message: 'File download URL generated successfully',
    });
  }
}