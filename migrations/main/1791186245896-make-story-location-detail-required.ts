import { MigrationInterface, QueryRunner } from "typeorm";

export class MakeStoryLocationDetailRequired1791186245896 implements MigrationInterface {
    name = 'MakeStoryLocationDetailRequired1791186245896'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "stories" ALTER COLUMN "location_detail" SET NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "stories" ALTER COLUMN "location_detail" DROP NOT NULL`);
    }

}
