---
name: add-endpoint
description: Add a FastAPI endpoint with Pydantic models and a pytest test.
premium: false
order: 30
applies_when:
  framework: fastapi
---
---
description: Scaffold a FastAPI endpoint
argument-hint: <method> <path>
---

Add a FastAPI endpoint for $ARGUMENTS.

1. Add the route to the appropriate `APIRouter` in the existing module layout — check how other endpoints are organized first. Don't dump everything into `main.py`.
2. Define request and response models as `pydantic.BaseModel` subclasses. Use `Field` with descriptions for any non-obvious fields. Don't use `dict` as a type.
3. Type the endpoint signature fully — request body, query params, path params, response model.
4. Use `Depends()` for cross-cutting concerns (auth, db session). Match the dependency-injection pattern already in the codebase.
5. Raise `HTTPException` with a meaningful status code on failure. Don't return error dicts manually.
6. Add a pytest test in `tests/` that hits the endpoint via the `TestClient` (or `httpx.AsyncClient` if the codebase uses async tests). Cover the happy path and one error case.
7. Run `pytest` and confirm green.

Auth: if every other endpoint pulls a current-user dependency, this one should too. Don't ship an unauthenticated route unless I asked for one.
