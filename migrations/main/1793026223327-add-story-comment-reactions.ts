import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddStoryCommentReactions1793026223327 implements MigrationInterface {
  name = 'AddStoryCommentReactions1793026223327';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "story_comment_reactions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "type" integer NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "comment_id" uuid NOT NULL, "user_id" uuid NOT NULL, CONSTRAINT "UQ_de470c78bcc0ebda4c7392f9de4" UNIQUE ("comment_id", "user_id"), CONSTRAINT "PK_11c3aa7f0f85b38a9356b4af6cf" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "story_comment_reactions" ADD CONSTRAINT "FK_1020915401c330d9a1d1d540b39" FOREIGN KEY ("comment_id") REFERENCES "story_comments"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "story_comment_reactions" ADD CONSTRAINT "FK_d3f0b4f76d19ba8bf7fdb85e0bf" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "story_comment_reactions" DROP CONSTRAINT "FK_d3f0b4f76d19ba8bf7fdb85e0bf"`,
    );
    await queryRunner.query(
      `ALTER TABLE "story_comment_reactions" DROP CONSTRAINT "FK_1020915401c330d9a1d1d540b39"`,
    );
    await queryRunner.query(`DROP TABLE "story_comment_reactions"`);
  }
}
