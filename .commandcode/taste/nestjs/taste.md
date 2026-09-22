# nestjs
- Use PATCH (not PUT) for update endpoints. Confidence: 0.65
- For update DTOs, extend PartialType of the create DTO rather than redeclare all fields individually. Confidence: 0.65
- Use dedicated param DTOs for create operations in services, not plain objects — even when the service method is only called internally by other modules. Confidence: 0.65
- When passing user info from controller to service, pass the entire `request.user` (TJWTPayload) object rather than extracting individual fields like just the name. Confidence: 0.65
- Wrap CUD service methods that perform multiple writes (entity mutation + audit log) in `dataSource.transaction()` to ensure atomicity, using `manager.getRepository()` inside the callback. Confidence: 0.70
- When flattening nested class-validator errors, join parent and child property names with dots (e.g., `address.city`) instead of using only the leaf property name. Confidence: 0.65
- Seeders should be idempotent: upsert rows by a natural `key` and only create missing join/pivot links, wrapped in `dataSource.transaction()`. Confidence: 0.70
- Keep seed data in JSON files under `seeders/*/datas/*.json` and have the seeder read from them rather than hardcoding data in the class. Confidence: 0.65
- Register seeders in the data source in dependency order (e.g., permissions → roles → users). Confidence: 0.60
