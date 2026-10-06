# workflow
- Plan before implementing code changes — write a plan first, get approval, then implement. Confidence: 0.70
- When refactoring (e.g., to CQRS), preserve existing API behavior exactly — same return values, same HTTP status codes, same response shapes. Flag and fix any behavioral drift immediately. Confidence: 0.85
- When asked to see the plan again (e.g., after a missclick), re-present the full plan in detail rather than just a one-line summary. Confidence: 0.55
- Treats `docs/db.dbml` and TypeORM entities as kept in sync bidirectionally — when changing a column property (e.g., nullability), update both the DBML and entity together, not just one side. Confidence: 0.75
- New non-relational columns (integers, strings) should default to `not null` in both DBML and TypeORM entity, unless the user explicitly says otherwise. Confidence: 0.65
- After implementing, verifies changes with `npm run build` and `npm run lint` (and checks diagnostics), clearly separating pre-existing failures from new ones. Confidence: 0.60
