import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddStoryComments1793016460019 implements MigrationInterface {
  name = 'AddStoryComments1793016460019';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "story_comments" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "content" text NOT NULL, "pinned_at" TIMESTAMP WITH TIME ZONE, "story_id" uuid NOT NULL, "user_id" uuid NOT NULL, "pinned_by" uuid, CONSTRAINT "PK_95e81fb1c37f90a0e47f4582551" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_ee42f9f8d70f8b12ea742c4eca" ON "story_comments" ("user_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_dc7424567875135d4f98299904" ON "story_comments" ("story_id", "pinned_at", "created_at") `,
    );
    await queryRunner.query(
      `ALTER TABLE "story_comments" ADD CONSTRAINT "FK_e10ceb785191acc262e9f54ddb8" FOREIGN KEY ("story_id") REFERENCES "stories"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "story_comments" ADD CONSTRAINT "FK_ee42f9f8d70f8b12ea742c4ecaa" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "story_comments" ADD CONSTRAINT "FK_5ee2e02addfae5bd62a9da69c6e" FOREIGN KEY ("pinned_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "story_comments" DROP CONSTRAINT "FK_5ee2e02addfae5bd62a9da69c6e"`,
    );
    await queryRunner.query(
      `ALTER TABLE "story_comments" DROP CONSTRAINT "FK_ee42f9f8d70f8b12ea742c4ecaa"`,
    );
    await queryRunner.query(
      `ALTER TABLE "story_comments" DROP CONSTRAINT "FK_e10ceb785191acc262e9f54ddb8"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_dc7424567875135d4f98299904"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_ee42f9f8d70f8b12ea742c4eca"`,
    );
    await queryRunner.query(`DROP TABLE "story_comments"`);
  }
}
