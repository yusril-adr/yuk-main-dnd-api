import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUniqueUserRoleIndex1794214755092 implements MigrationInterface {
  name = 'AddUniqueUserRoleIndex1794214755092';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await this.assertNoActiveDuplicates(queryRunner);

    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_user_roles_user_role" ON "user_roles" ("user_id", "role_id") WHERE "deleted_at" IS NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."UQ_user_roles_user_role"`);
  }

  private async assertNoActiveDuplicates(
    queryRunner: QueryRunner,
  ): Promise<void> {
    const rows: Array<{ user_id: string; role_id: string; n: string }> =
      await queryRunner.query(
        `SELECT "user_id", "role_id", COUNT(*)::text AS n
         FROM "user_roles"
         WHERE "deleted_at" IS NULL
         GROUP BY "user_id", "role_id"
         HAVING COUNT(*) > 1
         ORDER BY COUNT(*) DESC, "user_id", "role_id"`,
      );

    if (rows.length === 0) {
      return;
    }

    const summary = rows
      .map(
        (row) => `user_id=${row.user_id} role_id=${row.role_id} count=${row.n}`,
      )
      .join('; ');
    throw new Error(
      `Cannot create unique active index on user_roles: found ${rows.length} duplicate active user-role group(s): ${summary}`,
    );
  }
}
