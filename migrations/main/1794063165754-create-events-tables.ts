import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateEventsTables1794063165754 implements MigrationInterface {
  name = 'CreateEventsTables1794063165754';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "events" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "title" character varying(150) NOT NULL, "slug" character varying(180) NOT NULL, "description" text, "status" integer NOT NULL DEFAULT '1', "status_before" integer, "location_link" character varying(255), "feedback_form_link" character varying(255), "exp_awarded" integer NOT NULL DEFAULT '0', "point_awarded" integer NOT NULL DEFAULT '0', "max_members" integer, "start_at" TIMESTAMP WITH TIME ZONE, "location_type" integer NOT NULL, "location_detail" text NOT NULL, "created_by" uuid NOT NULL, "banner_file_id" uuid, CONSTRAINT "UQ_05bd884c03d3f424e2204bd14cd" UNIQUE ("slug"), CONSTRAINT "REL_51b31f370e31f347df912d432c" UNIQUE ("banner_file_id"), CONSTRAINT "PK_40731c7151fe4be3116e45ddf73" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_1a259861a2ce114f074b366eed" ON "events" ("created_by") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_03dcebc1ab44daa177ae9479c4" ON "events" ("status") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_2fbc92cd70088a083c3b0e78a0" ON "events" ("start_at") `,
    );
    await queryRunner.query(
      `CREATE TABLE "event_members" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "status" integer NOT NULL DEFAULT '1', "event_id" uuid NOT NULL, "user_id" uuid NOT NULL, CONSTRAINT "PK_d513d28092c89e6a40aa34a5a0e" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_10c092b944dc7ec4589f86de9c" ON "event_members" ("event_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_d428fa2fcb5c4d17598284064b" ON "event_members" ("user_id") `,
    );
    await queryRunner.query(
      `ALTER TABLE "events" ADD CONSTRAINT "FK_1a259861a2ce114f074b366eed2" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "events" ADD CONSTRAINT "FK_51b31f370e31f347df912d432c2" FOREIGN KEY ("banner_file_id") REFERENCES "files"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "event_members" ADD CONSTRAINT "FK_10c092b944dc7ec4589f86de9cb" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "event_members" ADD CONSTRAINT "FK_d428fa2fcb5c4d17598284064b8" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "event_members" DROP CONSTRAINT "FK_d428fa2fcb5c4d17598284064b8"`,
    );
    await queryRunner.query(
      `ALTER TABLE "event_members" DROP CONSTRAINT "FK_10c092b944dc7ec4589f86de9cb"`,
    );
    await queryRunner.query(
      `ALTER TABLE "events" DROP CONSTRAINT "FK_51b31f370e31f347df912d432c2"`,
    );
    await queryRunner.query(
      `ALTER TABLE "events" DROP CONSTRAINT "FK_1a259861a2ce114f074b366eed2"`,
    );
    await queryRunner.query(`DROP INDEX "IDX_d428fa2fcb5c4d17598284064b"`);
    await queryRunner.query(`DROP INDEX "IDX_10c092b944dc7ec4589f86de9c"`);
    await queryRunner.query(`DROP TABLE "event_members"`);
    await queryRunner.query(`DROP INDEX "IDX_2fbc92cd70088a083c3b0e78a0"`);
    await queryRunner.query(`DROP INDEX "IDX_03dcebc1ab44daa177ae9479c4"`);
    await queryRunner.query(`DROP INDEX "IDX_1a259861a2ce114f074b366eed"`);
    await queryRunner.query(`DROP TABLE "events"`);
  }
}
