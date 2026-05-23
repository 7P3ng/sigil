---
name: add-pydantic-model
description: Add a Pydantic model with proper validation and a fixture for tests.
premium: false
order: 40
applies_when:
  framework: fastapi
---
---
description: Scaffold a Pydantic model
argument-hint: <ModelName>
---

Add a Pydantic model named $ARGUMENTS.

1. Put it in the existing models module — check where other models live before creating a new file.
2. Use `pydantic.BaseModel`. Use `model_config = ConfigDict(...)` for Pydantic v2 settings, not the legacy `class Config`.
3. Every field needs a real type. Avoid `Any`, `dict`, `list` without parameters.
4. Add `Field(...)` constraints where natural (min_length, gt, regex). Validation belongs in the model, not in the endpoint.
5. If two models share most fields, factor out a base class. Don't repeat fields across input/output variants — use Pydantic inheritance.
6. If the model corresponds to a database row, document the mapping in a one-line comment. Don't conflate API models with ORM models; keep them separate.
7. Add a pytest fixture that returns a valid instance, so other tests can `model_fixture(name="foo")`-style override.

Run `pytest` to confirm nothing broke.
