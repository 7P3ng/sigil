---
name: safe-migration
description: Generate a database migration with deploy safety — zero-downtime, reversible, backfill-aware.
premium: true
order: 30
applies_when:
  database: [prisma, drizzle, alembic, django-orm]
---
---
description: Create a deploy-safe migration
argument-hint: <change description>
---

Create a migration for $ARGUMENTS. Deploy-safety first; convenience second.

## Step 1 — Classify the change

1. Tell me which class this falls into:
   - **Safe**: adding a nullable column, adding an index `CONCURRENTLY`, creating a new table, dropping an unused index.
   - **Read-then-write**: renaming a column, changing a column type, splitting a table. Requires multi-step rollout.
   - **Backfill-required**: adding a NOT NULL column with no default, populating a derived column.
   - **Destructive**: dropping a column, dropping a table, narrowing a type. Requires app-side cleanup BEFORE the migration.
2. If "Destructive" — stop and confirm with me. We almost certainly want a two-deploy plan.

## Step 2 — Generate the migration

3. Generate the migration with the project's tool:
   - Prisma: `npx prisma migrate dev --name <name>`.
   - Drizzle: `npx drizzle-kit generate`.
   - Alembic: `alembic revision --autogenerate -m '<name>'`.
   - Django: `python manage.py makemigrations <app>`.
4. **Read the generated SQL** before committing. Auto-generators can produce destructive operations (column type changes via drop-and-recreate) you didn't ask for.

## Step 3 — Safety patches

5. For each statement, check:
   - Index creation: must be `CONCURRENTLY` in Postgres for production. Auto-generators don't do this — patch manually.
   - NOT NULL on existing column: must be a 3-step migration (add nullable, backfill, set NOT NULL) for tables with rows.
   - Foreign key add: takes a lock proportional to table size. For large tables, add as `NOT VALID` then `VALIDATE` separately.
   - Column rename: usually generated as drop-and-recreate by auto-tools. Override with explicit RENAME COLUMN — preserves data.

## Step 4 — Backfill

6. If backfill is required, write the backfill in a SEPARATE migration (after the schema change) — never mix DDL and bulk DML in one transaction.
7. The backfill must be idempotent (re-runnable) and batched (LIMIT N, loop) for tables >100K rows.

## Step 5 — Down migration

8. Write the down migration. If the change is genuinely irreversible (dropped data), say so explicitly in a comment at the top of the migration file.

## Step 6 — Apply locally

9. Apply to local dev DB. Confirm the schema matches expectation.
10. Run `{{testCommand}}` — confirm tests pass with the new schema.

## Step 7 — Report

11. Show me: the classification, the patched migration SQL, the backfill (if any), and one sentence on whether the app code already tolerates the new schema (e.g. nullable column is OK because the app handles null).

Hard rules:
- Never run an unreviewed auto-generated migration on production.
- Never combine multiple destructive operations in a single migration.
