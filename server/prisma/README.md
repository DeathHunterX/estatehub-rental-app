# Database setup

`schema.prisma` is the current data model. `migrations/` is the checked-in history that creates and upgrades the database. PostgreSQL needs PostGIS and unaccent; the database user must be allowed to install these extensions.

`../prisma.config.ts` loads `.env.local`/`.env` for native Prisma commands and accepts the legacy DB_URL variable when DATABASE_URL is absent. There is no custom CLI wrapper.

## Fresh database

From `server/`:

```powershell
npm run prisma:deploy
npm run prisma:generate
```

Seeding is optional and explicit:

```powershell
npm run prisma:seed
```

Demo data lives in `seedData/*.json`, one file per current model; `seed.ts` loads the files and handles date shifting, conflict checks and insertion. The fixtures contain 25 new demo users (10 Managers and 15 Tenants), each with a separate Credentials account and password. The email and password for each account are listed in [SEED_ACCOUNTS.md](SEED_ACCOUNTS.md); `account.json` stores only bcrypt hashes. Related manager, tenant, property, lease, application, chat, message and notification references use the new user IDs. The fixtures include all application statuses, paid leases/payments and an approved application awaiting payment. Fixture dates are shifted relative to the seeding time. Stored access and refresh tokens are null, and no real signatures or accepted consents are fabricated. Manager demo users must complete agreement setup themselves. Seed data is for development/demo environments only; the seed command rejects `NODE_ENV=production`.

The expanded fixture has 15 locations and listings, 23 applications, 18 leases and payments, 6 chats, 20 messages and 14 notifications. The five new listings intentionally have no photos; the UI uses its existing no-photo fallback. Tenant property links mirror their leases, and 12 tenants have favorites. Nine older leases have no application record and remain historical examples rather than fabricated applications.

All inserts are transactional. Numeric IDs and their relationships are remapped above existing records; user/account/signing-profile conflicts stop the run without overwriting records. `npm run prisma:seed -- -- --dry-run` checks conflicts without inserting data. A dry run is not a substitute for the schema and seed integration tests.

## Existing databases

Back up the database first and run `npm run prisma:status`.

- If `20260924110704_init` is already recorded as applied, use `npm run prisma:deploy`. The additive migration accepts the former manual compatibility upgrades and preserves existing application amounts. It fills missing original rent/deposit and derives negotiated rent from an existing lease when available.
- If an existing database was created without migration history, compare its schema with `20260924110704_init/migration.sql` before baselining. Only after confirming that the initial structures already exist, run `npx prisma migrate resolve --applied 20260924110704_init`, then `npm run prisma:deploy`. Do not mark a migration applied to an empty database or one that lacks its tables.
- Do not use migrate reset or db push as an upgrade for a database containing real records. Do not edit the initial migration once applied. No upgrade is run automatically when the API starts.

The application database used during development has not been changed by this source consolidation. Deploy the pending migration through this documented process when ready.

## Future changes

Edit `schema.prisma`, then create and review a migration in development:

```powershell
npm run prisma:migrate -- --name descriptive_change
npm run prisma:generate
```

Commit the schema, migration and generated client types together. Use `prisma:deploy` in deployed environments. Data backfills that cannot be represented in the Prisma schema belong in reviewed migration SQL, not in a separate SQL folder.
