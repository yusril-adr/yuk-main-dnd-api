import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddDirectionToUserExpLogs1792877746877 implements MigrationInterface {
  name = 'AddDirectionToUserExpLogs1792877746877';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "user_exp_logs" ADD "direction" integer NOT NULL DEFAULT '1'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "user_exp_logs" DROP COLUMN "direction"`,
    );
  }
}
