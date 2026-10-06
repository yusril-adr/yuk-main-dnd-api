# Taste (Continuously Learned by [CommandCode][cmd])

[cmd]: https://commandcode.ai/

# typescript
- For TypeORM entities, disable strictPropertyInitialization in tsconfig instead of using `!` definite assignment assertions on properties. Confidence: 0.65
- For TypeORM many-to-many relations whose join table carries its own timestamps or soft-delete, use explicit pivot entities rather than `@ManyToMany`/`@JoinTable`; make pivot entities extend `BaseEntity` (single `id` PK + timestamps) with a `@Unique` index on the FK pair, instead of composite primary keys. Confidence: 0.80

# workflow
See [workflow/taste.md](workflow/taste.md)
# nestjs
See [nestjs/taste.md](nestjs/taste.md)
