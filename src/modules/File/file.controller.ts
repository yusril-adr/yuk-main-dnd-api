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
import * as wrapper from '@shared/utils/wrapper';
import { Public } from '@shared/decorators/public.decorator';
import type { TUploadedFile } from '@shared/types/uploaded-file.type';
import { FileService } from './file.service';
import { FileUploadParamDto } from './dtos/params/file-upload.param.dto';

@Controller({
  path: 'files',
  version: '1',
})
export class FileController {
  constructor(private readonly fileService: FileService) {}

  @Post('upload')
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(FileInterceptor('file'))
  async upload(
    @Body() payload: FileUploadParamDto,
    @UploadedFile() file?: TUploadedFile,
  ) {
    const result = await this.fileService.upload(
      file,
      payload.purpose,
      payload.metadata,
    );

    return wrapper.response({
      statusCode: HttpStatus.CREATED,
      data: result,
      message: 'File uploaded successfully',
    });
  }

  @Get('download/:id')
  @Public()
  async download(@Param('id') id: string) {
    const result = await this.fileService.getDownloadUrl(id);

    return wrapper.response({
      data: result,
      message: 'File download URL generated successfully',
    });
  }
}
