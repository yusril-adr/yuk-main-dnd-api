import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddActiveUserUniqueIndexes1794241108561
  implements MigrationInterface
{
  name = 'AddActiveUserUniqueIndexes1794241108561';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await this.assertNoActiveEmailDuplicates(queryRunner);
    await this.assertNoActiveUsernameDuplicates(queryRunner);

    await queryRunner.query(`DROP INDEX "public"."UQ_users_email_not_null"`);

    // Soft-deleted users free their email for re-registration (active rows only).
    // Keep plain email (case-sensitive), matching the previous index semantics.
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_users_email_active" ON "users" ("email") WHERE "email" IS NOT NULL AND "deleted_at" IS NULL`,
    );

    // Soft-deleted users free their username; compare case-insensitively like the app check.
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_users_username_active" ON "users" (LOWER("username")) WHERE "username" IS NOT NULL AND "deleted_at" IS NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "public"."UQ_users_username_active"`,
    );
    await queryRunner.query(`DROP INDEX "public"."UQ_users_email_active"`);

    // Recreate the prior partial unique index from AddGuestUsers1793100000000.
    // Soft-deleted rows still hold their email under that index.
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_users_email_not_null" ON "users" ("email") WHERE "email" IS NOT NULL`,
    );
  }

  private async assertNoActiveEmailDuplicates(
    queryRunner: QueryRunner,
  ): Promise<void> {
    const rows: Array<{ email: string; n: string }> = await queryRunner.query(
      `SELECT "email", COUNT(*)::text AS n
       FROM "users"
       WHERE "email" IS NOT NULL AND "deleted_at" IS NULL
       GROUP BY "email"
       HAVING COUNT(*) > 1
       ORDER BY COUNT(*) DESC, "email"`,
    );

    if (rows.length === 0) {
      return;
    }

    const summary = rows
      .map((row) => `email=${row.email} count=${row.n}`)
      .join('; ');
    throw new Error(
      `Cannot create unique active email index on users: found ${rows.length} duplicate active email group(s): ${summary}`,
    );
  }

  private async assertNoActiveUsernameDuplicates(
    queryRunner: QueryRunner,
  ): Promise<void> {
    const rows: Array<{ username_lower: string; n: string }> =
      await queryRunner.query(
        `SELECT LOWER("username") AS username_lower, COUNT(*)::text AS n
         FROM "users"
         WHERE "username" IS NOT NULL AND "deleted_at" IS NULL
         GROUP BY LOWER("username")
         HAVING COUNT(*) > 1
         ORDER BY COUNT(*) DESC, LOWER("username")`,
      );

    if (rows.length === 0) {
      return;
    }

    const summary = rows
      .map((row) => `username_lower=${row.username_lower} count=${row.n}`)
      .join('; ');
    throw new Error(
      `Cannot create unique active username index on users: found ${rows.length} duplicate active username group(s): ${summary}`,
    );
  }
}
