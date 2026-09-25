import { MigrationInterface, QueryRunner } from "typeorm";

export class AddAvatarFileColumn1790311336363 implements MigrationInterface {
    name = 'AddAvatarFileColumn1790311336363'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" RENAME COLUMN "avatar_url" TO "avatar_file_id"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "avatar_file_id"`);
        await queryRunner.query(`ALTER TABLE "users" ADD "avatar_file_id" uuid`);
        await queryRunner.query(`ALTER TABLE "users" ADD CONSTRAINT "UQ_65eb1fa7df7811daaec973798ce" UNIQUE ("avatar_file_id")`);
        await queryRunner.query(`ALTER TABLE "users" ADD CONSTRAINT "FK_65eb1fa7df7811daaec973798ce" FOREIGN KEY ("avatar_file_id") REFERENCES "files"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT "FK_65eb1fa7df7811daaec973798ce"`);
        await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT "UQ_65eb1fa7df7811daaec973798ce"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "avatar_file_id"`);
        await queryRunner.query(`ALTER TABLE "users" ADD "avatar_file_id" text`);
        await queryRunner.query(`ALTER TABLE "users" RENAME COLUMN "avatar_file_id" TO "avatar_url"`);
    }

}
