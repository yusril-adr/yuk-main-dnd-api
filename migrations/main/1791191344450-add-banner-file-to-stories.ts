import { MigrationInterface, QueryRunner } from "typeorm";

export class AddBannerFileToStories1791191344450 implements MigrationInterface {
    name = 'AddBannerFileToStories1791191344450'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "stories" ADD "banner_file_id" uuid`);
        await queryRunner.query(`ALTER TABLE "stories" ADD CONSTRAINT "UQ_743276153088b8b767ad5bc62c2" UNIQUE ("banner_file_id")`);
        await queryRunner.query(`ALTER TABLE "stories" ADD CONSTRAINT "FK_743276153088b8b767ad5bc62c2" FOREIGN KEY ("banner_file_id") REFERENCES "files"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "stories" DROP CONSTRAINT "FK_743276153088b8b767ad5bc62c2"`);
        await queryRunner.query(`ALTER TABLE "stories" DROP CONSTRAINT "UQ_743276153088b8b767ad5bc62c2"`);
        await queryRunner.query(`ALTER TABLE "stories" DROP COLUMN "banner_file_id"`);
    }

}
