import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddTypeToUserExpLogs1791626477001 implements MigrationInterface {
  name = 'AddTypeToUserExpLogs1791626477001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "user_exp_logs" ADD "type" integer NOT NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "user_exp_logs" DROP COLUMN "type"`);
  }
}
