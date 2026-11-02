# DeliveryPilot frontend instructions

Read docs/product.md, docs/ui/UI-RULES.md, docs/ui/AGENT-BRIEF.md, and docs/frontend/architecture.md before editing. Preserve supplied skeleton filenames and approved routes in src/lib/routes.ts. Use BlankPage.tsx as the canonical future-feature template.

The initial bootstrap authorization is consumed. Future changes to dependencies, routes, theme tokens, components.json, or generated src/components/ui files require explicit approval. For actual conflicts or missing decisions, use the exact UI-ESC-01 block, stop affected work, and continue independent permitted work. Do not duplicate or replace the rulebook.

Use feature-first ownership, @/ imports, strict types, semantic HTML, existing shadcn primitives, and local state. Pages coordinate; features own behavior; shared components compose primitives. Keep pages/compositions within 180 nonblank/noncomment physical lines. Reuse the authorized Axios/TanStack Query foundation described in docs/frontend/api-integration.md. Feature modules own verified API contracts and query/mutation definitions; components contain no raw transport. Reuse the authorized authentication guard and memory session; see docs/frontend/authentication.md. Avoid speculative endpoints, additional auth frameworks, persisted tokens, global product state, or business workflows.

Fixture records are fictional and stay in src/mocks/workspaces.ts; synthetic API adapters/harnesses stay under src/test and are never production contracts. Slugs and membership labels never grant access. Preview queries demonstrate presentations only and must be removed from connected screens. Never present a mock write or preview as a successful real operation. Only deliverypilot-theme may persist.

Inspect .agents/skills if supplied by a later task and read applicable SKILL.md files before use. The project skill directory is now present; it was absent at bootstrap. At that time, requested React/composition/shadcn/design-system/Impeccable skills were unavailable. Do not claim absent skills were reviewed or install skills without authorization.

Colocate behavior tests and follow docs/frontend/development.md and testing.md. Run typecheck, lint, format:check, test:run, and build before delivery. Verify responsive/keyboard/theme behavior when browser tools permit; report limitations honestly.
