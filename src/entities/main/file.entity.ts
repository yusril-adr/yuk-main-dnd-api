import { Column, Entity } from "typeorm";
import { BaseEntity } from "./base.entity";

@Entity()
export class File extends BaseEntity {
  @Column()
  name: string;

  @Column()
  bucket: string;

  @Column()
  path: string;

  @Column()
  size: number;

  @Column()
  mimetype: string;

  @Column({ length: 50 })
  driver: string;
}

export type TFile = InstanceType<typeof File>;
