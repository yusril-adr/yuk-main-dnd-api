import { MigrationInterface, QueryRunner } from "typeorm";

export class AddStatusInFileTable1790353292440 implements MigrationInterface {
    name = 'AddStatusInFileTable1790353292440'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "files" ADD "status" character varying(50) NOT NULL DEFAULT 'active'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "files" DROP COLUMN "status"`);
    }

}
