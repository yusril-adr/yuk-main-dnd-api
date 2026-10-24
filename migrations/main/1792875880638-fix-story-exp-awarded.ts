import { MigrationInterface, QueryRunner } from 'typeorm';

export class FixStoryExpAwarded1792875880638 implements MigrationInterface {
  name = 'FixStoryExpAwarded1792875880638';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "stories" ALTER COLUMN "exp_awarded" SET DEFAULT 1`,
    );
    await queryRunner.query(`UPDATE "stories" SET "exp_awarded" = 1`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Previous per-story exp_awarded values are not restored.
    await queryRunner.query(
      `ALTER TABLE "stories" ALTER COLUMN "exp_awarded" SET DEFAULT 0`,
    );
  }
}
