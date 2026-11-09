import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUniqueActiveMemberIndexes1794209047205 implements MigrationInterface {
  name = 'AddUniqueActiveMemberIndexes1794209047205';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await this.assertNoActiveDuplicates(
      queryRunner,
      'story_members',
      'story_id',
    );
    await this.assertNoActiveDuplicates(
      queryRunner,
      'event_members',
      'event_id',
    );

    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_story_members_story_user_active" ON "story_members" ("story_id", "user_id") WHERE "deleted_at" IS NULL`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_event_members_event_user_active" ON "event_members" ("event_id", "user_id") WHERE "deleted_at" IS NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "public"."UQ_event_members_event_user_active"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."UQ_story_members_story_user_active"`,
    );
  }

  private async assertNoActiveDuplicates(
    queryRunner: QueryRunner,
    table: 'story_members' | 'event_members',
    parentColumn: 'story_id' | 'event_id',
  ): Promise<void> {
    const rows: Array<{ parent_id: string; user_id: string; n: string }> =
      await queryRunner.query(
        `SELECT "${parentColumn}" AS parent_id, "user_id", COUNT(*)::text AS n
         FROM "${table}"
         WHERE "deleted_at" IS NULL
         GROUP BY "${parentColumn}", "user_id"
         HAVING COUNT(*) > 1
         ORDER BY COUNT(*) DESC, "${parentColumn}", "user_id"`,
      );

    if (rows.length === 0) {
      return;
    }

    const summary = rows
      .map(
        (row) =>
          `${parentColumn}=${row.parent_id} user_id=${row.user_id} count=${row.n}`,
      )
      .join('; ');
    throw new Error(
      `Cannot create unique active index on ${table}: found ${rows.length} duplicate active membership group(s): ${summary}`,
    );
  }
}
