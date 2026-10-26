import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddStoryCommentReplies1793022390597 implements MigrationInterface {
  name = 'AddStoryCommentReplies1793022390597';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "story_comments" ADD "parent_id" uuid`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_9c714c717ffbc5408c693b857e" ON "story_comments" ("parent_id", "created_at") `,
    );
    await queryRunner.query(
      `ALTER TABLE "story_comments" ADD CONSTRAINT "FK_076d8a0cfd71b413f74e26e7763" FOREIGN KEY ("parent_id") REFERENCES "story_comments"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "story_comments" DROP CONSTRAINT "FK_076d8a0cfd71b413f74e26e7763"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_9c714c717ffbc5408c693b857e"`,
    );
    await queryRunner.query(
      `ALTER TABLE "story_comments" DROP COLUMN "parent_id"`,
    );
  }
}
