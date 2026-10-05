import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateStoriesTable1791182614631 implements MigrationInterface {
    name = 'CreateStoriesTable1791182614631'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "stories" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "title" character varying(150) NOT NULL, "slug" character varying(180) NOT NULL, "description" text, "status" character varying(30) NOT NULL DEFAULT 'draft', "type" character varying(30) NOT NULL, "game_system" character varying(100), "max_members" integer, "start_at" TIMESTAMP WITH TIME ZONE, "location_type" character varying(20) NOT NULL, "location_detail" text, "created_by" uuid NOT NULL, CONSTRAINT "UQ_0e45709567c3d81765b64ba1153" UNIQUE ("slug"), CONSTRAINT "PK_bb6f880b260ed96c452b32a39f0" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_4cf69714ce53654b30bce45399" ON "stories" ("created_by") `);
        await queryRunner.query(`CREATE INDEX "IDX_f4db74cea8a693da5be9926e64" ON "stories" ("status") `);
        await queryRunner.query(`CREATE INDEX "IDX_6a991a216142aa148f79b0602e" ON "stories" ("type") `);
        await queryRunner.query(`CREATE INDEX "IDX_a21c0defda06860ca38b699702" ON "stories" ("start_at") `);
        await queryRunner.query(`ALTER TABLE "stories" ADD CONSTRAINT "FK_4cf69714ce53654b30bce453998" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "stories" DROP CONSTRAINT "FK_4cf69714ce53654b30bce453998"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_a21c0defda06860ca38b699702"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_6a991a216142aa148f79b0602e"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_f4db74cea8a693da5be9926e64"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_4cf69714ce53654b30bce45399"`);
        await queryRunner.query(`DROP TABLE "stories"`);
    }

}
