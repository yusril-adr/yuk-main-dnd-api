import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddFeedbackFormLinkToStories1792939645962 implements MigrationInterface {
  name = 'AddFeedbackFormLinkToStories1792939645962';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "stories" ADD "feedback_form_link" character varying(255)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "stories" DROP COLUMN "feedback_form_link"`,
    );
  }
}
