import { MigrationInterface, QueryRunner } from "typeorm";

export class AddStatusBeforeToStories1791277810457 implements MigrationInterface {
    name = 'AddStatusBeforeToStories1791277810457'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "stories" ADD "status_before" character varying(30)`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "stories" DROP COLUMN "status_before"`);
    }

}
