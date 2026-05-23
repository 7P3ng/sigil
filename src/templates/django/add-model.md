---
name: add-model
description: Add a Django model with proper Meta, indexes, and an admin registration.
premium: false
order: 40
applies_when:
  framework: django
---
---
description: Scaffold a Django model
argument-hint: <ModelName>
---

Add a Django model named $ARGUMENTS.

1. Put it in the appropriate app's `models.py`. Don't create a new app unless this is a new domain.
2. Every field needs an explicit type. Use the narrowest sensible field (e.g. `EmailField` over `CharField` for emails).
3. Add `Meta.ordering` and `Meta.indexes` for fields you'll query on. Indexes are cheap; missing them at scale isn't.
4. Add `__str__` returning a human-readable identifier — required for admin and shell debugging.
5. Add `created_at` and `updated_at` (`auto_now_add` / `auto_now`) unless this is explicitly intermediate state.
6. Register in `<app>/admin.py` with a `ModelAdmin` that has sensible `list_display`, `search_fields`, and `list_filter`.
7. Generate the migration: `python manage.py makemigrations <app>` — review the generated file, don't blindly accept rename heuristics.
8. Apply locally: `python manage.py migrate`.
9. If the model has a unique constraint or removes a field, add a data migration step (manual `RunPython`) before the schema migration — don't lose data.

Confirm `python manage.py check` is clean.
