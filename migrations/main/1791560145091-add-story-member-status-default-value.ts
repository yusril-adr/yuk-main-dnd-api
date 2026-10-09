import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddStoryMemberStatusDefaultValue1791560145091 implements MigrationInterface {
  name = 'AddStoryMemberStatusDefaultValue1791560145091';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "story_members" ALTER COLUMN "status" SET DEFAULT '1'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "story_members" ALTER COLUMN "status" DROP DEFAULT`,
    );
  }
}
