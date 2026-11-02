import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddGuestUsers1793100000000 implements MigrationInterface {
  name = 'AddGuestUsers1793100000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users" ADD "is_guest" boolean NOT NULL DEFAULT false`,
    );
    await queryRunner.query(`ALTER TABLE "users" ADD "created_by" uuid`);
    await queryRunner.query(
      `ALTER TABLE "users" ADD "merged_into_user_id" uuid`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ALTER COLUMN "email" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ALTER COLUMN "password" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" DROP CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3"`,
    );
    // Soft-deleted rows still hold their email, matching the previous unique
    // constraint. Only NULL emails (guests) may repeat.
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_users_email_not_null" ON "users" ("email") WHERE "email" IS NOT NULL`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_users_is_guest" ON "users" ("is_guest")`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD CONSTRAINT "FK_users_created_by" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD CONSTRAINT "FK_users_merged_into_user_id" FOREIGN KEY ("merged_into_user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users" DROP CONSTRAINT "FK_users_merged_into_user_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" DROP CONSTRAINT "FK_users_created_by"`,
    );
    await queryRunner.query(`DROP INDEX "public"."IDX_users_is_guest"`);
    await queryRunner.query(`DROP INDEX "public"."UQ_users_email_not_null"`);
    // Fail the down if any null email/password remain.
    await queryRunner.query(
      `ALTER TABLE "users" ALTER COLUMN "password" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ALTER COLUMN "email" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email")`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" DROP COLUMN "merged_into_user_id"`,
    );
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "created_by"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "is_guest"`);
  }
}
