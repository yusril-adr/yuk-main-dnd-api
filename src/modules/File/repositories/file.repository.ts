import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { File as FileEntity } from '@entities/main/file.entity';

@Injectable()
export class FileRepository extends Repository<FileEntity> {
  constructor(private readonly dataSource: DataSource) {
    super(FileEntity, dataSource.createEntityManager());
  }
}
