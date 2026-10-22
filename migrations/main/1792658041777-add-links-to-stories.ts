import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddLinksToStories1792658041777 implements MigrationInterface {
  name = 'AddLinksToStories1792658041777';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "stories" ADD "discord_channel_link" character varying(255)`,
    );
    await queryRunner.query(
      `ALTER TABLE "stories" ADD "location_link" character varying(255)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "stories" DROP COLUMN "location_link"`,
    );
    await queryRunner.query(
      `ALTER TABLE "stories" DROP COLUMN "discord_channel_link"`,
    );
  }
}
