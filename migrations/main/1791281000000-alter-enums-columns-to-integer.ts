import { MigrationInterface, QueryRunner } from "typeorm";

export class AlterEnumsColumnsToInteger1791281000000 implements MigrationInterface {
    name = 'AlterEnumsColumnsToInteger1791281000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // files table
        await queryRunner.query(`ALTER TABLE "files" ALTER COLUMN "driver" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "files" ALTER COLUMN "driver" TYPE INTEGER USING "driver"::integer`);

        await queryRunner.query(`ALTER TABLE "files" ALTER COLUMN "status" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "files" ALTER COLUMN "status" TYPE INTEGER USING "status"::integer`);
        await queryRunner.query(`ALTER TABLE "files" ALTER COLUMN "status" SET DEFAULT 2`);

        // stories table
        await queryRunner.query(`ALTER TABLE "stories" ALTER COLUMN "status" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "stories" ALTER COLUMN "status" TYPE INTEGER USING "status"::integer`);
        await queryRunner.query(`ALTER TABLE "stories" ALTER COLUMN "status" SET DEFAULT 1`);

        await queryRunner.query(`ALTER TABLE "stories" ALTER COLUMN "status_before" TYPE INTEGER USING "status_before"::integer`);

        await queryRunner.query(`ALTER TABLE "stories" ALTER COLUMN "type" TYPE INTEGER USING "type"::integer`);

        await queryRunner.query(`ALTER TABLE "stories" ALTER COLUMN "location_type" TYPE INTEGER USING "location_type"::integer`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // files table
        await queryRunner.query(`ALTER TABLE "files" ALTER COLUMN "status" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "files" ALTER COLUMN "status" TYPE VARCHAR(50)`);
        await queryRunner.query(`ALTER TABLE "files" ALTER COLUMN "status" SET DEFAULT 'active'`);

        await queryRunner.query(`ALTER TABLE "files" ALTER COLUMN "driver" TYPE VARCHAR(50)`);

        // stories table
        await queryRunner.query(`ALTER TABLE "stories" ALTER COLUMN "location_type" TYPE VARCHAR(20)`);
        await queryRunner.query(`ALTER TABLE "stories" ALTER COLUMN "type" TYPE VARCHAR(30)`);

        await queryRunner.query(`ALTER TABLE "stories" ALTER COLUMN "status_before" TYPE VARCHAR(30)`);

        await queryRunner.query(`ALTER TABLE "stories" ALTER COLUMN "status" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "stories" ALTER COLUMN "status" TYPE VARCHAR(30)`);
        await queryRunner.query(`ALTER TABLE "stories" ALTER COLUMN "status" SET DEFAULT 'draft'`);
    }

}