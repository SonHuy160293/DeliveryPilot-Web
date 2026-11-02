# DeliveryPilot — UI coding-agent brief

> Copy this brief into each UI task. Do not make product, authorization, design or dependency decisions independently.

## Read order (mandatory)

1. Read `docs/ui/UI-RULES.md` completely; record rule IDs relevant to the task.
2. Read `src/lib/routes.ts`, `src/app/router.tsx`, `src/index.css`, `src/layouts/*`, `src/pages/BlankPage.tsx`, and the shared `src/components/*` composition patterns. Read the existing target feature files, if present.
3. Read the task specification. Consult `product.md` and approved product/architecture/requirements files for business meaning. If a referenced authority is unavailable, record that gap and stop where it matters.

## How to start a new feature

1. Verify the route already exists in `ROUTES`. If not, request approval with UI-ESC-01. Do not add one yourself.
2. Copy the structural composition of `BlankPage`: `PageHeader` with breadcrumb, `PageStateGate`, and content composed from shadcn primitives.
3. Put feature-specific UI in `src/features/<feature>/`; use `src/components/` only for reusable, primitive-based wrappers.
4. Provide accessible ready/loading/empty/error/success/no-permission states and keyboard behavior before any styling changes.
5. Keep placeholders explicit. Do not infer authentication, tenant authorization, approvals or real API contracts from mock data.
6. Use only approved routes, colors, spacing, copy voice, props and dependencies. If a missing decision blocks a step, use UI-ESC-01 and stop the affected work.

## Definition of done

- [ ] All applicable UI-RULES IDs satisfied; no forbidden changes.
- [ ] All six required states present (including ready); no fake success or authorization.
- [ ] 320/375/768/1024/1440px responsive checks complete.
- [ ] Keyboard-only path, visible focus, meaningful labels, contrast and reduced motion checked.
- [ ] Light and dark modes verified.
- [ ] No new dependencies, icons, routes, arbitrary styles, `any`, raw colors or side-effect mocks.
- [ ] No change to `src/index.css`, `components.json`, generated `src/components/ui`, or `package.json` unless explicitly approved.
- [ ] Existing tests pass; `npm run build` and `npm run lint` pass, or exact blocking evidence is recorded.
- [ ] Public-facing copy distinguishes actual functionality from future capabilities.

## Required completion report

```text
FEATURE: <name>
STATUS: COMPLETE | PARTIAL | BLOCKED
FILES CHANGED: <paths, with short purpose>
RULES APPLIED: <UI-... IDs>
STATES VERIFIED: ready / loading / empty / error / success / no-permission
ACCESSIBILITY: <checks performed and findings>
VALIDATION: <commands + actual result, never claim unrun success>
OPEN QUESTIONS: <numbered decisions, or None>
```

## Reusable task prompt

```text
Implement a DeliveryPilot UI feature using docs/ui/AGENT-BRIEF.md.

Feature: <name + feature ID if available>
Page: <existing route constant and path>
User goal: <specific outcome>
Persona / audience: <who sees it, without assuming grants>
Data shown: <field + source contract + visibility scope>
Actions: <verb, input, expected result, authorization rule>
States: <ready, loading, empty, error, success, no-permission details>
Acceptance criteria:
  - <observable criterion 1>
  - <observable criterion 2>
Dependencies already approved: <none or exact package names>
Constraints / non-goals: <boundaries>

Read UI-RULES.md, then the existing skeleton, then this task.
If any dependency, page rule, authorization requirement or API detail is absent or contradictory,
STOP and ask exactly as UI-ESC-01. Do not improvise. Do not install packages.
Return the required completion report.
```
