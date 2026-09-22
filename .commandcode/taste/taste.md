# Taste (Continuously Learned by [CommandCode][cmd])

[cmd]: https://commandcode.ai/

# typescript
- For TypeORM entities, disable strictPropertyInitialization in tsconfig instead of using `!` definite assignment assertions on properties. Confidence: 0.65
- For TypeORM many-to-many relations whose join table carries its own timestamps or soft-delete, use explicit pivot entities rather than `@ManyToMany`/`@JoinTable`; make pivot entities extend `BaseEntity` (single `id` PK + timestamps) with a `@Unique` index on the FK pair, instead of composite primary keys. Confidence: 0.80

# workflow
- Plan before implementing code changes — write a plan first, get approval, then implement. Confidence: 0.70
- When asked to see the plan again (e.g., after a missclick), re-present the full plan in detail rather than just a one-line summary. Confidence: 0.55
- Treats `docs/db.dbml` as the source of truth for the database schema; TypeORM entities should be updated to match it when the DBML changes. Confidence: 0.65

# nestjs
See [nestjs/taste.md](nestjs/taste.md)
