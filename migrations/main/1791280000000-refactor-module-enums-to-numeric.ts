import { MigrationInterface, QueryRunner } from "typeorm";

export class RefactorModuleEnumsToNumeric1791280000000 implements MigrationInterface {
    name = 'RefactorModuleEnumsToNumeric1791280000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // files table
        await queryRunner.query(`UPDATE "files" SET "driver" = '2' WHERE "driver" = 'supabase'`);
        await queryRunner.query(`UPDATE "files" SET "driver" = '1' WHERE "driver" = 'local'`);
        await queryRunner.query(`UPDATE "files" SET "status" = '1' WHERE "status" = 'temporary'`);
        await queryRunner.query(`UPDATE "files" SET "status" = '2' WHERE "status" = 'active'`);

        // stories table
        await queryRunner.query(`UPDATE "stories" SET "status" = '1' WHERE "status" = 'draft'`);
        await queryRunner.query(`UPDATE "stories" SET "status" = '2' WHERE "status" = 'published'`);
        await queryRunner.query(`UPDATE "stories" SET "status" = '3' WHERE "status" = 'archived'`);
        await queryRunner.query(`UPDATE "stories" SET "status_before" = '1' WHERE "status_before" = 'draft'`);
        await queryRunner.query(`UPDATE "stories" SET "status_before" = '2' WHERE "status_before" = 'published'`);
        await queryRunner.query(`UPDATE "stories" SET "status_before" = '3' WHERE "status_before" = 'archived'`);
        await queryRunner.query(`UPDATE "stories" SET "type" = '1' WHERE "type" = 'oneshot'`);
        await queryRunner.query(`UPDATE "stories" SET "type" = '2' WHERE "type" = 'campaign'`);
        await queryRunner.query(`UPDATE "stories" SET "location_type" = '1' WHERE "location_type" = 'online'`);
        await queryRunner.query(`UPDATE "stories" SET "location_type" = '2' WHERE "location_type" = 'offline'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // files table
        await queryRunner.query(`UPDATE "files" SET "driver" = 'supabase' WHERE "driver" = '2'`);
        await queryRunner.query(`UPDATE "files" SET "driver" = 'local' WHERE "driver" = '1'`);
        await queryRunner.query(`UPDATE "files" SET "status" = 'temporary' WHERE "status" = '1'`);
        await queryRunner.query(`UPDATE "files" SET "status" = 'active' WHERE "status" = '2'`);

        // stories table
        await queryRunner.query(`UPDATE "stories" SET "status" = 'draft' WHERE "status" = '1'`);
        await queryRunner.query(`UPDATE "stories" SET "status" = 'published' WHERE "status" = '2'`);
        await queryRunner.query(`UPDATE "stories" SET "status" = 'archived' WHERE "status" = '3'`);
        await queryRunner.query(`UPDATE "stories" SET "status_before" = 'draft' WHERE "status_before" = '1'`);
        await queryRunner.query(`UPDATE "stories" SET "status_before" = 'published' WHERE "status_before" = '2'`);
        await queryRunner.query(`UPDATE "stories" SET "status_before" = 'archived' WHERE "status_before" = '3'`);
        await queryRunner.query(`UPDATE "stories" SET "type" = 'oneshot' WHERE "type" = '1'`);
        await queryRunner.query(`UPDATE "stories" SET "type" = 'campaign' WHERE "type" = '2'`);
        await queryRunner.query(`UPDATE "stories" SET "location_type" = 'online' WHERE "location_type" = '1'`);
        await queryRunner.query(`UPDATE "stories" SET "location_type" = 'offline' WHERE "location_type" = '2'`);
    }

}