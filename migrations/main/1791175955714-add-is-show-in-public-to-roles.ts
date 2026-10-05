import { MigrationInterface, QueryRunner } from "typeorm";

export class AddIsShowInPublicToRoles1791175955714 implements MigrationInterface {
    name = 'AddIsShowInPublicToRoles1791175955714'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "roles" ADD "is_show_in_public" boolean NOT NULL DEFAULT true`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "roles" DROP COLUMN "is_show_in_public"`);
    }

}
