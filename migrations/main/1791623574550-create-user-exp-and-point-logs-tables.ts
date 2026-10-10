import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateUserExpAndPointLogsTables1791623574550 implements MigrationInterface {
  name = 'CreateUserExpAndPointLogsTables1791623574550';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "user_exp_logs" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "amount" integer NOT NULL, "description" text, "user_id" uuid NOT NULL, CONSTRAINT "PK_bc11bca6e03b7726e36a4f987e3" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_19a41f67406cb2071f0cf25ebc" ON "user_exp_logs" ("user_id", "created_at") `,
    );
    await queryRunner.query(
      `CREATE TABLE "user_point_logs" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "amount" integer NOT NULL, "type" integer NOT NULL, "description" text, "user_id" uuid NOT NULL, CONSTRAINT "PK_43d59f187036a51d98b07c47020" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_f7cee2610c1a785a028ff268db" ON "user_point_logs" ("user_id", "created_at") `,
    );
    await queryRunner.query(
      `ALTER TABLE "user_exp_logs" ADD CONSTRAINT "FK_92dbe9d8df0aa14b8e1eb7c05dd" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_point_logs" ADD CONSTRAINT "FK_b676734492e9177158b16a73d79" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "user_point_logs" DROP CONSTRAINT "FK_b676734492e9177158b16a73d79"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_exp_logs" DROP CONSTRAINT "FK_92dbe9d8df0aa14b8e1eb7c05dd"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_f7cee2610c1a785a028ff268db"`,
    );
    await queryRunner.query(`DROP TABLE "user_point_logs"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_19a41f67406cb2071f0cf25ebc"`,
    );
    await queryRunner.query(`DROP TABLE "user_exp_logs"`);
  }
}
