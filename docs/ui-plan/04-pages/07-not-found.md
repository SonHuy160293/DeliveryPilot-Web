# Page 07 — Not found

| Item   | Value                        |
| ------ | ---------------------------- |
| Status | **Existing**                 |
| Route  | `ROUTES.notFound` → `*`      |
| File   | `src/pages/NotFoundPage.tsx` |
| Roles  | Anyone                       |
| Exit   | "Return home" → `/`          |

## Purpose and behavior

Shown for unknown paths **and** for proposed routes whose ID segment fails UUID validation (`/w/<bad>/projects`, `/portal/projects/<bad>`), before any request.

```
┌──────────────── Card ────────────────┐
│ Page not found                        │
│ The page you asked for doesn't exist. │
│ [Return home]                         │
└───────────────────────────────────────┘
```

Resource-level "not found or no access" for a valid UUID is **not** this page: it is the in-page state defined in `03-design-system.md` §6 so layout and navigation stay available.

## Acceptance criteria

- [ ] One `h1`; focus moves to `main` on render.
- [ ] Invalid UUIDs in proposed routes render this page without a network/mock call.
