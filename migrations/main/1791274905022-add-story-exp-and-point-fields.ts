import { MigrationInterface, QueryRunner } from "typeorm";

export class AddStoryExpAndPointFields1791274905022 implements MigrationInterface {
    name = 'AddStoryExpAndPointFields1791274905022'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "stories" ADD "exp_awarded" integer NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "stories" ADD "point_awarded" integer NOT NULL DEFAULT '0'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "stories" DROP COLUMN "point_awarded"`);
        await queryRunner.query(`ALTER TABLE "stories" DROP COLUMN "exp_awarded"`);
    }

}
