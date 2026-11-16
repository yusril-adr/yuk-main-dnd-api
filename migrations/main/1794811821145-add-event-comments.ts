import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddEventComments1794811821145 implements MigrationInterface {
  name = 'AddEventComments1794811821145';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "event_comments" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "parent_id" uuid, "content" text NOT NULL, "pinned_at" TIMESTAMP WITH TIME ZONE, "event_id" uuid NOT NULL, "user_id" uuid NOT NULL, CONSTRAINT "PK_261532ab6a0aeb468c436fa1679" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_d8a347b4d500000f8e2d4c9483" ON "event_comments" ("user_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_df5491872058955e39a0fbf975" ON "event_comments" ("parent_id", "created_at") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_96ffca117ad39458c2d5ba2aef" ON "event_comments" ("event_id", "pinned_at", "created_at") `,
    );
    await queryRunner.query(
      `CREATE TABLE "event_comment_reactions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "type" integer NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "comment_id" uuid NOT NULL, "user_id" uuid NOT NULL, CONSTRAINT "UQ_d15743f003860c9cbd3e55ae428" UNIQUE ("comment_id", "user_id"), CONSTRAINT "PK_0cb0b49d44749f74e03e9178333" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "event_comments" ADD CONSTRAINT "FK_2872e03140f7eb6b76899b2ca69" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "event_comments" ADD CONSTRAINT "FK_d8a347b4d500000f8e2d4c9483e" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "event_comments" ADD CONSTRAINT "FK_7eee00b48121df4b52f82a6518f" FOREIGN KEY ("parent_id") REFERENCES "event_comments"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "event_comment_reactions" ADD CONSTRAINT "FK_f0bce7361686b9f87c88514e1cb" FOREIGN KEY ("comment_id") REFERENCES "event_comments"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "event_comment_reactions" ADD CONSTRAINT "FK_4d9a6428599d4a56e11ba056d7d" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "event_comment_reactions" DROP CONSTRAINT "FK_4d9a6428599d4a56e11ba056d7d"`,
    );
    await queryRunner.query(
      `ALTER TABLE "event_comment_reactions" DROP CONSTRAINT "FK_f0bce7361686b9f87c88514e1cb"`,
    );
    await queryRunner.query(
      `ALTER TABLE "event_comments" DROP CONSTRAINT "FK_7eee00b48121df4b52f82a6518f"`,
    );
    await queryRunner.query(
      `ALTER TABLE "event_comments" DROP CONSTRAINT "FK_d8a347b4d500000f8e2d4c9483e"`,
    );
    await queryRunner.query(
      `ALTER TABLE "event_comments" DROP CONSTRAINT "FK_2872e03140f7eb6b76899b2ca69"`,
    );
    await queryRunner.query(`DROP TABLE "event_comment_reactions"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_96ffca117ad39458c2d5ba2aef"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_df5491872058955e39a0fbf975"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_d8a347b4d500000f8e2d4c9483"`,
    );
    await queryRunner.query(`DROP TABLE "event_comments"`);
  }
}
