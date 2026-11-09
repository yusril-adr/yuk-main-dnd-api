import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { EventEntity as Event } from '@entities/main/event/event.entity';

@Injectable()
export class EventRepository extends Repository<Event> {
  constructor(private readonly dataSource: DataSource) {
    super(Event, dataSource.createEntityManager());
  }
}
