import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateStoryMembersTable1791554116924 implements MigrationInterface {
    name = 'CreateStoryMembersTable1791554116924'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "story_members" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "status" integer NOT NULL, "story_id" uuid NOT NULL, "user_id" uuid NOT NULL, CONSTRAINT "PK_1bb26161d1e6164be400b44d13a" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_f62df18a8ac529a6d1e01ad723" ON "story_members" ("story_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_103eaf891e892dc8a0e408ff44" ON "story_members" ("user_id") `);
        await queryRunner.query(`ALTER TABLE "story_members" ADD CONSTRAINT "FK_f62df18a8ac529a6d1e01ad723b" FOREIGN KEY ("story_id") REFERENCES "stories"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "story_members" ADD CONSTRAINT "FK_103eaf891e892dc8a0e408ff444" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "story_members" DROP CONSTRAINT "FK_103eaf891e892dc8a0e408ff444"`);
        await queryRunner.query(`ALTER TABLE "story_members" DROP CONSTRAINT "FK_f62df18a8ac529a6d1e01ad723b"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_103eaf891e892dc8a0e408ff44"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_f62df18a8ac529a6d1e01ad723"`);
        await queryRunner.query(`DROP TABLE "story_members"`);
    }

}
