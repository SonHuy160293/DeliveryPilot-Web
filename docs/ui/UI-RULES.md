# DeliveryPilot UI Rulebook

**Version:** 1.0 — proposed baseline  
**Authority:** `product.md` v1.0 establishes product boundaries; this document establishes approved *UI-skeleton defaults only*.  
**Status:** Pending owner approval for project-specific unknowns in `AGENT-BRIEF.md`.  
**Terminology:** UI MUST say **workspace**. Backend names such as TenantId/OrganizationId remain unchanged.

Each numbered rule is normative. **MUST** and **MUST NOT** are testable constraints. Verification instructions are mandatory. Agents MUST NOT resolve conflicts or unknowns by guessing.

## 1. Tokens and visual system

| ID | Rule | Verify |
|---|---|---|
| UI-TKN-01 | UI MUST use semantic colors only: `background`, `foreground`, `card`, `popover`, `primary`, `secondary`, `muted`, `accent`, `destructive`, `border`, `input`, `ring` and their paired foreground tokens. UI MUST NOT use hex/RGB/OKLCH or palette classes inside TSX. | `rg '#[[:xdigit:]]{3,8}|(bg|text|border)-(red|blue|slate|gray|green|zinc)-' src --glob '*.tsx'` finds nothing. |
| UI-TKN-02 | `src/index.css` MUST own all color tokens for `:root` and `.dark`. `@theme inline` MUST map them to Tailwind `--color-*` aliases; contrast MUST be checked in both modes. | Inspect CSS mapping; contrast-check normal text >= 4.5:1, large text >= 3:1, non-text boundaries >= 3:1 when needed. |
| UI-TKN-03 | Radius MUST derive from `--radius: 0.625rem`: `sm = radius - 0.25rem`, `md = radius - 0.125rem`, `lg = radius`, `xl = radius + 0.25rem`. No invented rounding values. | Only `rounded-sm`, `rounded-md`, `rounded-lg`, `rounded-xl`, `rounded-full` where semantically necessary. |
| UI-TKN-04 | Spacing MUST use Tailwind's 4px unit (`--spacing` mapped to `--dp-space-unit`); allowed steps: 1, 2, 3, 4, 6, 8, 12, 16. Other spacing scales or arbitrary values MUST NOT be added. | Search spacing classes; reject `p-[...]`, `gap-[...]`, `mt-[...]` and unsupported steps. |
| UI-TKN-05 | Typography MUST use the system sans-serif stack, weight 400/500/600/700, and `text-xs/sm/base/lg/xl/2xl/3xl/4xl` mapped from CSS variables. Main body MUST be `text-base`, secondary UI MAY be `text-sm`; `text-xs` MUST NOT carry essential body content. | Inspect `@theme inline` and responsive headings at 320px / 768px. |
| UI-TKN-06 | Elevation MUST use only `shadow-sm` and `shadow-md`, mapped to `--dp-shadow-1` and `--dp-shadow-2`. No glow, deep/drop shadow, gradient or decorative effects. | Search for `shadow-`, `drop-shadow`, `gradient`, `blur-`; compare with allowlist. |
| UI-TKN-07 | CSS token source MUST be frozen after initial bootstrap. Feature agents MUST NOT edit `src/index.css`, `components.json` or generated `src/components/ui/*` without explicit change approval. | Code review and changed-file diff. |

**Semantic color roles:** `background` = page canvas; `foreground` = primary text; `primary` = main action; `muted` = quiet surface and secondary text; `destructive` = deletion/error; `border` = separation; `ring` = visible focus; `card/popover` = raised surfaces; `secondary/accent` = subtle interactive surfaces. Never encode business status solely through color.

## 2. Components

| Need | Allowed component | Custom allowed? |
|---|---|---|
| Main actions, links styled as actions | shadcn `Button` + React Router `Link` via `asChild` | No |
| Data groups and empty illustrations-free surfaces | shadcn `Card` | No |
| Text entry and field labels | shadcn `Input` + `Label` | No |
| Confirmation and create forms | shadcn `Dialog` | No |
| Small-screen navigation | shadcn `Sheet` | No |
| Breadcrumb navigation | shadcn `Breadcrumb` | No |
| Notices/errors | shadcn `Alert` | No |
| Loading placeholders | shadcn `Skeleton` | No |
| Status tags and separators | shadcn `Badge`, `Separator` | No |
| Screen composition | `PageHeader`, `SectionHeading`, `EmptyState`, `ScreenState` wrappers | Yes: composition only |

| ID | Rule | Verify |
|---|---|---|
| UI-CMP-01 | Existing shadcn primitives MUST be used before composing wrappers. A custom primitive MUST NOT be implemented when an allowed shadcn primitive exists. | Compare imports and table above. |
| UI-CMP-02 | Custom components MAY only compose existing primitives, isolate page-specific UI, or fulfill native semantic HTML not covered by shadcn. They MUST NOT introduce new styling primitives. | Review each new shared component's imports and responsibilities. |
| UI-CMP-03 | Agents MUST NOT install any UI library, icon set, charting library, state package, or dependency. Any missing dependency MUST be escalated with the exact proposed package and reason. | Diff `package.json`, lockfile and `components.json`; they must be unchanged by feature agents. |

## 3. Layout, responsive behavior and navigation

| ID | Rule | Verify |
|---|---|---|
| UI-LAY-01 | `PublicLayout` MUST provide marketing/auth header, main content and footer. `AppLayout` MUST provide a skip link, sidebar, topbar, workspace-switcher placeholder and content outlet. | Navigate `/`, `/sign-in`, `/sign-up`, `/workspaces`, `/w/:workspaceSlug`. |
| UI-LAY-02 | Marketing content MUST use `max-w-6xl`; app content MUST use `max-w-7xl`; auth card MUST use `max-w-md`. Main content MUST NOT overflow horizontally at 320px. | Check viewport widths 320, 375, 768, 1024, 1440. |
| UI-LAY-03 | Layout MUST be mobile-first: single column by default, 2 columns from `md` (768px), optional 3 columns at `xl` (1280px). App sidebar MUST be hidden below `md` and accessible in a `Sheet`; on desktop it MUST be 16rem wide. | Responsive screenshot/DOM inspection. |
| UI-LAY-04 | Topbar MUST remain visible as content scrolls. Primary navigation MUST be keyboard accessible and MUST NOT require hover. | Scroll and test Tab/Enter/Escape. |
| UI-LAY-05 | Only routes declared in `src/lib/routes.ts` MAY be linked or added; route paths MUST NOT be string literals elsewhere. New routes require explicit owner approval and a route-map update. | Search for `to="/`, `navigate("/` outside `routes.ts`; compare `router.tsx`. |
| UI-LAY-06 | Navigation and content MUST NOT assume a workspace is authorized from the URL slug alone. Workspace selection and client visibility MUST be based on later approved backend checks. | Review loaders/guards; confirm demo contains no private real data. |

## 4. Universal screen states

| ID | Rule | Verify |
|---|---|---|
| UI-STA-01 | Every page MUST expose `ready`, `loading`, `empty`, `error`, `success`, `no-permission` presentations. This skeleton uses `?state=` ONLY for manual demo previews; it MUST NOT represent real auth, API or persistence. | Visit each page with each query state. |
| UI-STA-02 | Loading MUST expose an accessible status and a skeleton; error MUST explain failure without exposing internals; empty MUST explain a next step; success MUST describe a verified result; no-permission MUST avoid leaking sensitive details and actions. | Manual UI review + screen reader labels. |
| UI-STA-03 | A production feature MUST remove demo override when connecting real data and MUST derive states from authorized query/mutation outcomes, never from untrusted query params. | Review feature integration diff and auth tests. |
| UI-STA-04 | UI MUST NOT present mock operations as successful writes, grant access, or show fake AI confidence. | Check preview banners and UI copy against actual behavior. |

## 5. Forms and destructive actions

| ID | Rule | Verify |
|---|---|---|
| UI-FRM-01 | Every input MUST have a visible label above it, a stable `id`, and explicit `htmlFor`. Required errors MUST connect with `aria-describedby` and `aria-invalid`. | Inspect label/input wiring, a11y tests. |
| UI-FRM-02 | Validation MUST run when a field blurs or after submit is attempted; it MAY update live once the field has an error. Error text MUST be concise, actionable and adjacent, in `text-sm text-destructive`. | Enter invalid email/empty fields; Tab/submit. |
| UI-FRM-03 | A surface MUST have at most one emphasized primary action. Secondary actions MUST use `outline`, `secondary`, `ghost`, or `link`. Disabled buttons MUST explain an unavailable capability in surrounding copy. | Count primary variants and inspect disabled copy. |
| UI-FRM-04 | Destructive actions MUST require a named, explicit confirmation dialog and MUST state the consequence. They MUST NOT run automatically on navigation. | Review delete/cancel flows (not present in scaffold). |
| UI-FRM-05 | Auth and workspace creation form values MUST remain UI-only in the scaffold; MUST NOT be sent, persisted, or interpreted as authenticated identity. | Search for `fetch`, `axios`, `localStorage` of form data, mutation hooks. Theme preference is exempt. |
| UI-FRM-06 | Email MUST use required/email-format UI validation; password MUST only be required until an approved policy exists. Workspace name MUST be non-empty; slug MUST follow lowercase letters/digits/hyphens with no leading/trailing hyphen as a provisional UI-only proposal, NOT a verified backend contract. | Exercise invalid/valid forms; escalate if backend spec differs. |

## 6. Content and formatting

| ID | Rule | Verify |
|---|---|---|
| UI-CNT-01 | UI MUST use sentence case, plain English and **workspace** everywhere in user-facing strings. It MUST NOT say tenant or organization for the owning boundary. Client organization is a distinct domain concept. | Text search and content review. |
| UI-CNT-02 | UI MUST NOT contain lorem ipsum, emojis, invented customer quotes, invented ROI, or unsupported promises of predictive AI. Marketing placeholders MUST use `TODO(copy)` and factual, modest language. | Content review; search `TODO(copy)` on HomePage. |
| UI-CNT-03 | Actions MUST start with verbs: “Create workspace”, “Review requirement”. Empty states MUST say what is absent and what can be done next. Error copy MUST say what happened and what action is safe. | Review representative strings. |
| UI-CNT-04 | Date-only mock values MUST display as `2 Nov 2026` (day–short month–year in UTC); numbers MUST use `Intl.NumberFormat('en-US')`. Future localization MUST be approved before replacing formatters. | Check mock row output and snapshots. |
| UI-CNT-05 | Work state, QA result, client acceptance and release status MUST be represented separately. Risk/issue/blocker/dependency MUST NOT be used interchangeably. | Acceptance criteria for any future status screen. |

## 7. Accessibility

| ID | Rule | Verify |
|---|---|---|
| UI-A11Y-01 | All interactive views MUST target WCAG 2.2 AA, with meaningful headings, landmarks, labels and text alternatives where applicable. | axe/Lighthouse and manual checks. |
| UI-A11Y-02 | All essential interactions MUST work with keyboard only, with visible focus ring; modal focus MUST be trapped and returned on close. | Tab, Shift+Tab, Enter, Space, Escape. |
| UI-A11Y-03 | Text MUST meet 4.5:1 contrast (3:1 for large text); focus and meaningful control boundaries MUST meet 3:1. Never rely solely on color to convey status. | Contrast audit in light/dark mode. |
| UI-A11Y-04 | Buttons and links MUST have discernible names; error/status regions MUST use appropriate `role="alert"` or `role="status"`. `aria-*` MUST express semantics, not duplicate native input behavior unnecessarily. | Accessibility tree review. |
| UI-A11Y-05 | Essential targets MUST be at least 24x24 CSS px or provide equivalent spacing; primary touch targets SHOULD be 44px tall. Content MUST remain usable at 200% zoom and 320px. | Zoom/responsive testing. |

## 8. Motion

| ID | Rule | Verify |
|---|---|---|
| UI-MOT-01 | Motion MAY be used only for functional feedback (focus, dialog entry/exit, disclosure), with duration 100–180ms and ease-out. Decorative looping/parallax MUST NOT be added. | Search animation/transition classes, inspect durations. |
| UI-MOT-02 | `prefers-reduced-motion: reduce` MUST remove nonessential animations and transitions. | Emulate reduced motion. |

## 9. Theme and dark mode

| ID | Rule | Verify |
|---|---|---|
| UI-DRK-01 | Both light and dark mode MUST be supported. Light MUST be the default; manual choice MAY persist only as `deliverypilot-theme`. All surfaces MUST use mapped tokens, never raw colors. | Toggle both layouts; reload; inspect both palettes. |
| UI-DRK-02 | The theme toggle MUST be keyboard accessible and have an accurate accessible name. It MUST NOT change product data or authentication state. | Test with keyboard and inspect browser storage. |

## 10. Code conventions and architecture

| ID | Rule | Verify |
|---|---|---|
| UI-COD-01 | Directory ownership MUST be: `src/app` router, `src/layouts` shells, `src/pages` route pages, `src/features/<feature>` feature UI, `src/components` small shared compositions, `src/components/ui` generated shadcn, `src/lib` route/util helpers, `src/mocks` fixtures. | Compare file tree. |
| UI-COD-02 | Component filenames MUST use PascalCase (`PageHeader.tsx`), utilities camelCase (`routes.ts`), exported components PascalCase, variables camelCase. | Filename/type lint review. |
| UI-COD-03 | Route page and composite component files MUST remain <= 180 physical lines excluding blanks/comments; anything larger MUST be decomposed without adding new primitives. | `wc -l` plus review. |
| UI-COD-04 | TypeScript strict mode MUST be enabled. `any`, `@ts-ignore`, unsound casts, implicit `any` and untyped event handlers MUST NOT be introduced. | `tsc --noEmit` and ESLint. |
| UI-COD-05 | Styling MUST use Tailwind classes backed by allowed tokens. Inline `style`, CSS modules, CSS-in-JS, arbitrary-value utilities (`w-[347px]`), and hard-coded color names MUST NOT be used in feature files. | `rg 'style=|\[[^]]+(px|#)' src --glob '*.tsx'`. |
| UI-COD-06 | The skeleton MUST NOT implement domain business logic, network calls, auth guards pretending to be secure, real persistence, or external state libraries. UI-only `useState` is allowed for inputs/dialog state; mock records MUST live only in `src/mocks/workspaces.ts`. | Search imports and side effects. |

## 11. Forbidden actions

| ID | Rule | Verify |
|---|---|---|
| UI-FBD-01 | Agents MUST NOT invent colors, shadows, gradients, photography, illustrations, decorative imagery, icons, arbitrary spacing, or new component variants. | Diff CSS/TSX and token audit. |
| UI-FBD-02 | Agents MUST NOT install packages, change package lock, modify generated shadcn files, edit theme config, rename skeleton files, or create routes outside `routes.ts` without prior approval. | Inspect git diff and dependency manifest. |
| UI-FBD-03 | Agents MUST NOT show client-private data, infer grants from job titles/URL slugs, silently approve a requirement, auto-change delivery commitments, or claim AI certainty unsupported by evidence. | Security and copy review for each feature. |

## 12. Escalation: stop, then ask

| ID | Rule | Verify |
|---|---|---|
| UI-ESC-01 | When documentation conflicts, required information is missing, or implementation needs a forbidden change, the agent MUST stop **before** modifying the affected files and ask using the exact block below. The agent MUST NOT substitute a guess or decide from aesthetics alone. | Confirm unresolved tasks produce block, no prohibited edits. |

```text
UI DECISION REQUIRED
Rule ID(s): UI-___-__
Feature / route: <name and route constant>
Conflict or missing information: <one factual sentence>
Evidence checked: <file paths and relevant headings>
Why this blocks implementation: <observable impact>
Recommended decision: <one specific option and rationale>
Alternative (if materially different): <one alternative or "None">
Files that would change after approval: <paths>
Question for owner: <one answerable question>
Status: BLOCKED — no affected files modified
```

## Explicit product guardrails

- Requirements and approval records are version-specific and auditable. A story marked Done MUST NOT imply QA Passed, Client Accepted or Released.
- Scope changes MUST preserve historical baselines. AI suggestions MUST show evidence and MUST NOT autonomously alter commitments.
- A workspace may own many projects; the same user may belong to several workspaces. Client organizations have intentionally scoped access; NEVER equate client identity with ownership.
- MVP navigation MUST NOT promise next-release features (forecasting, AI drafting, advanced predictive dashboards) as already available.

## Source and implementation authority

1. Approved feature task / UX acceptance criteria, only where consistent with security/product constraints.
2. This UI rulebook for visual and code conventions.
3. `product.md` for product domain principles, subject to linked requirements/architecture when supplied.
4. Existing route constants and scaffold code for established patterns.

If higher-level files are unavailable or contradictory, use UI-ESC-01 rather than silently reconciling them.
