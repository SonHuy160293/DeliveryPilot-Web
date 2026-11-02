# Foundation verification — 2 Nov 2026

This is the historical bootstrap verification record. For the later API integration foundation and its current validation, see [api-integration.md](api-integration.md). Earlier statements that API infrastructure is absent describe the bootstrap state.

## 1. Implementation summary

The approved mock-only frontend foundation is runnable. The source-only constraint pack was integrated into the initially empty repository without a nested app. All supplied filenames and route paths were retained. Marketing, auth variants, workspace cards/create dialog, the canonical blank template, and a useful wildcard fallback are implemented. No business workflows or backend behavior were added.

## 2. Architecture

Feature-first ownership, local form/dialog state, a small composition root, and shared primitive compositions. AppRoutes is independent of browser history for testing the actual route tree. AuthForm and HomeSections isolate coherent responsibilities and keep every page/composition below 180 nonblank/noncomment lines. No empty provider or service abstractions exist.

The complete source tree below excludes ignored dependencies, caches, generated build output, and Git internals.

```text
.
├── .editorconfig
├── .env.example
├── .gitignore
├── .prettierignore
├── .prettierrc.json
├── AGENTS.md
├── components.json
├── docs/
│   ├── frontend/
│   │   ├── architecture.md
│   │   ├── bootstrap.md
│   │   ├── development.md
│   │   ├── testing.md
│   │   └── verification.md
│   ├── product.md
│   └── ui/
│       ├── AGENT-BRIEF.md
│       ├── PRODUCT-UX-ANALYSIS.md
│       ├── SETUP.md
│       └── UI-RULES.md
├── eslint.config.js
├── index.html
├── package-lock.json
├── package.json
├── README.md
├── scripts/
│   └── check-ui.mjs
├── src/
│   ├── app/
│   │   ├── router.test.tsx
│   │   └── router.tsx
│   ├── components/
│   │   ├── EmptyState.tsx
│   │   ├── PageHeader.tsx
│   │   ├── PageStateGate.tsx
│   │   ├── ScreenState.tsx
│   │   ├── SectionHeading.tsx
│   │   ├── shared.test.tsx
│   │   ├── ThemeToggle.tsx
│   │   └── ui/
│   │       ├── alert.tsx
│   │       ├── badge.tsx
│   │       ├── breadcrumb.tsx
│   │       ├── button.tsx
│   │       ├── card.tsx
│   │       ├── dialog.tsx
│   │       ├── input.tsx
│   │       ├── label.tsx
│   │       ├── separator.tsx
│   │       ├── sheet.tsx
│   │       └── skeleton.tsx
│   ├── features/
│   │   ├── auth/
│   │   │   ├── AuthForm.test.tsx
│   │   │   └── AuthForm.tsx
│   │   ├── marketing/
│   │   │   └── HomeSections.tsx
│   │   └── workspaces/
│   │       ├── WorkspaceCreateDialog.test.tsx
│   │       └── WorkspaceCreateDialog.tsx
│   ├── index.css
│   ├── layouts/
│   │   ├── AppLayout.tsx
│   │   └── PublicLayout.tsx
│   ├── lib/
│   │   ├── routes.ts
│   │   └── utils.ts
│   ├── main.tsx
│   ├── mocks/
│   │   └── workspaces.ts
│   ├── pages/
│   │   ├── AuthPage.tsx
│   │   ├── BlankPage.tsx
│   │   ├── HomePage.tsx
│   │   ├── NotFoundPage.tsx
│   │   └── WorkspacesPage.tsx
│   └── test/
│       ├── renderRoute.tsx
│       └── setup.ts
├── tsconfig.app.json
├── tsconfig.json
├── tsconfig.node.json
└── vite.config.ts
```

## 3. Dependencies

No existing packages were present. package.json and package-lock.json contain the approved bootstrap dependencies. shadcn CLI 4.23.0 generated eleven new-york/Radix primitives; it is not retained as a dependency. Lucide supplies only generated structural close/breadcrumb icons. No extra icon set, state library, API client, chart library, form framework, or CSS-in-JS was added.

Direct installed versions:

- @eslint/js: 9.39.5
- @tailwindcss/vite: 4.3.3
- @testing-library/jest-dom: 7.0.1
- @testing-library/react: 16.3.3
- @testing-library/user-event: 14.6.8
- @types/node: 24.19.2
- @types/react: 19.3.0
- @types/react-dom: 19.3.0
- @vitejs/plugin-react: 6.1.2
- class-variance-authority: 0.7.1
- clsx: 2.1.1
- eslint: 9.39.5
- eslint-plugin-jsx-a11y: 6.10.2
- eslint-plugin-react-hooks: 7.1.1
- eslint-plugin-react-refresh: 0.5.7
- globals: 17.14.0
- jsdom: 30.1.3
- lucide-react: 1.66.0
- prettier: 3.9.10
- radix-ui: 1.8.1
- react: 19.3.1
- react-dom: 19.3.1
- react-router: 7.18.5
- tailwind-merge: 3.7.0
- tailwindcss: 4.3.3
- typescript: 5.9.3
- typescript-eslint: 8.72.1
- vite: 8.3.5
- vitest: 5.0.5

ESLint 9 is retained because the current JSX accessibility plugin does not accept ESLint 10. npm labels ESLint 9 unsupported. A clean npm ci completed successfully with a valid dependency tree. npm audit --omit=dev reports zero findings. The full audit reports 13 moderate findings in development lint tooling's minimatch dependency chain (GHSA-g3hv-75wg-m249). No force/downgrade/major override was applied. Review those tools together when compatible fixed versions are available.

Official compatibility references are linked in bootstrap.md.

## 4. Skills used and availability

- Sites: loaded and applied the local-only repository workflow, direct checks/builds, local preview guidance, and server teardown. No hosted Site, publishing, or source synchronization was requested or performed.
- Computer-use skill was read during browser-tool preparation. Actual browser verification used the documented CUA in-app browser API; no native Windows app manipulation was needed.
- react-best-practices, composition-patterns, shadcn, design-system, and impeccable were requested but absent from the pack, repository, and inspected local skill directories. None was installed or claimed as applied. Written UI/product requirements governed implementation. The final consistency review was performed directly, without claiming an Impeccable skill review.

## 5. Files created or modified

All final source files are new to this initially empty repository:

- Root manifest/lockfile and Vite/TypeScript configuration establish the runtime, strict aliases, build, and test environment.
- ESLint/Prettier/editor configuration, ignore rules, and env example establish contributor hygiene and safe placeholders.
- AGENTS.md and README.md provide extension rules and Windows setup.
- docs/product.md and docs/ui/* retain supplied authorities unchanged.
- docs/frontend/* document ownership, development, testing, dependency decisions, and these results.
- src/main.tsx and app/router.tsx compose the app and approved routes.
- src/layouts/* implement public/workspace shells, sticky headers, skip links, mobile Sheet, and theme access.
- src/pages/* retain supplied page identities and add the wildcard fallback.
- src/features/* isolate auth form, marketing sections, and workspace creation preview.
- src/components/* preserve shared page/state compositions; ui/* contains the generated, normalized, frozen primitive baseline.
- src/lib/* contains typed route constants/builder and class merging; src/mocks/workspaces.ts retains supplied fixtures.
- Four colocated test files and src/test/* verify behavior with the actual route tree.
- scripts/check-ui.mjs verifies the frozen CSS hash, semantic colors, spacing, arbitrary utilities, composition size, and 32 token contrast pairs.

## 6. Quality checks

| Check                            | Result                   | Evidence                                                                              |
| -------------------------------- | ------------------------ | ------------------------------------------------------------------------------------- |
| npm ci                           | PASS                     | Clean install of 448 packages; audit limitations above                                |
| npm run typecheck                | PASS                     | Strict tsc build, no errors                                                           |
| npm run lint                     | PASS                     | ESLint zero warnings; UI source and contrast checks passed                            |
| npm run format:check             | PASS                     | All matched files use Prettier style                                                  |
| npm run test:run                 | PASS                     | 4 files, 58 tests; final run 5.04 seconds                                             |
| npm run build                    | PASS                     | Vite 8.3.5; 2,184 transformed modules                                                 |
| Runtime smoke                    | PASS                     | Dev and production preview; all six route matches, direct navigation and refresh      |
| Responsive layout                | PASS                     | 320, 375, 768, 1024, 1440px; light/dark; no document overflow                         |
| Browser state previews           | PASS                     | 36 route/state combinations; expected presentations                                   |
| Keyboard/accessibility behavior  | PASS within tested scope | Form errors/focus, dialog keyboard/return, mobile navigation, skip link, labels/roles |
| axe/Lighthouse and screen reader | NOT RUN                  | No audit runner or assistive-technology session configured                            |
| Actual 200% browser zoom         | NOT RUN                  | No supported zoom-emulation control used                                              |
| Reduced-motion browser emulation | NOT RUN                  | Source media rule and static skeleton/no-animation code inspected                     |

Final build: index.html 0.53 kB; CSS 31.67 kB (gzip 6.52 kB); JS 365.58 kB (gzip 113.77 kB). No warnings or errors were observed in the captured browser console. Static preview returned HTTP 200 and the SPA root for all six paths; real production hosting still requires document fallback configuration.

Browser checks additionally verified the desktop sidebar is 256px, hides below md, headers compute sticky, light remains selected after refresh, mobile dialog autofocus, validation and honest feedback, Escape/focus return, mobile Sheet selection/closing, and skip-link focus. The 320×350 dialog stayed within the viewport (top 0, bottom 350) with internal scroll capacity. Sticky positioning was inspected; a separate sustained-scroll interaction was not completed.

The original CSS SHA-256 remains 6544929c42a32ce66b1e55a63107bfbb2579a7b00f1dde893119f0c13a51ca0c. Product/UI document and fixture hashes also match their supplied sources.

## 7. UI rules reviewed

- UI-TKN-01–07: semantic colors, token mapping and freeze, radius/spacing/typography/shadows. 16 contrast pairs per mode passed their respective thresholds; the lowest pair is 4.55:1 in light and 3.59:1 in dark (input boundary, threshold 3:1). Body-text pairs meet 4.5:1.
- UI-CMP-01–03, UI-FBD-01–03: approved primitives and bootstrap-authorized dependencies only; no decorative assets or fabricated functionality.
- UI-LAY-01–06: shells, widths, responsive navigation, sticky CSS, centralized routes, and explicit mock-only authorization boundary.
- UI-STA-01–04: all six states and honest mock feedback; preview query is never a grant.
- UI-FRM-01–03 and 05–06: labels, accessible blur/submit validation, primary actions, required-only passwords, provisional slug, no credential/product persistence. UI-FRM-04 is not applicable: no destructive actions.
- UI-CNT-01–05: workspace terminology, TODO(copy), modest product direction, UTC dates/en-US numbers, separate future lifecycle concepts.
- UI-A11Y-01–05: headings/landmarks, labels, focus, modal keyboard behavior, contrast, and responsive targets reviewed within the limits above. No WCAG certification claimed.
- UI-MOT-01–02: functional 150ms transitions only; no animated skeletons; supplied reduced-motion CSS preserved. Emulation remains unverified.
- UI-DRK-01–02: both palettes, accurate toggle name, light default, theme-only persistence.
- UI-COD-01–06: ownership, filenames, size limit, strict typed/linted code, approved utility styling, no network/domain implementation.
- UI-ESC-01: no unresolved product/design decision required a forbidden change. Requested optional engineering guidance remained unavailable and is disclosed above.

No known source-rule violation remains. Unverified browser/audit items remain limitations, not passed checks.

## 8. Windows PowerShell setup

Use Node 24 LTS; validated with Node 24.15.0 and npm 12.2.1. No backend or env file is required.

```powershell
npm ci
npm run dev
npm run typecheck
npm run lint
npm run format:check
npm run test:run
npm run build
npm run preview
```

If needed, set $env:npm_config_cache = Join-Path $PWD '.cache/npm' before npm ci. Start/stop dev or preview with the terminal lifecycle. Configure SPA fallback when deploying to a static host. No hosted deployment or Git commit was created by this task; the lockfile is included in the working tree for review/commit.

## 9. Historical bootstrap limitations

All auth, workspace creation/switching, permissions, and fixtures remain UI-only. No API contract, credential transmission/storage, session, server authorization, or business feature exists. Marketing TODO(copy) remains pending approval. Requested project-specific skills were unavailable. The blueprint's linked requirements/architecture/roadmap were not supplied or reviewed. Browser zoom, reduced-motion emulation, full automated accessibility audits, screen readers, and production VPS hosting remain unverified. The development-only lint audit findings remain recorded above.

## 10. Historical bootstrap next slice

Agree the session, sign-in, workspace membership, visibility, and error contracts, then implement one sign-in-to-authorized-workspace vertical slice. Enforce all grants server-side, remove demo overrides from connected screens, and use verified server outcomes for status. Do not add project/backlog/approval features as part of that slice without approved requirements.

## 11. Organization integration — 6 November 2026

This section supersedes bootstrap-only implementation statements above for Organization. See [Organization integration](organization-integration.md) for contract authority, architecture, and remaining verification gates. All 30 operations have runtime-validated adapters and connected flows. The sole new product route is `/join-workspace`; existing workspace segments use organization UUIDs. Tabs, Checkbox, Select, and Textarea are the only approved primitive additions.

| Check                            | Actual result                                                                                          |
| -------------------------------- | ------------------------------------------------------------------------------------------------------ |
| `npm run typecheck`              | PASS                                                                                                   |
| `npm run lint`                   | PASS; frozen tokens, contrast pairs, semantic utilities, and composition limits pass                   |
| `npm run format:check`           | PASS                                                                                                   |
| `npm run test:run`               | PASS — 198 tests across 14 files                                                                       |
| `npm run build`                  | PASS; largest JS chunk 400.42 kB, gzip 123.49 kB; no >500 kB warning                                   |
| Production fixture exclusion     | Synthetic review token/banner and fictional Organization records absent from production JavaScript     |
| Frozen-file review               | Package/lockfile, components.json, theme, BlankPage, and previously generated primitives unchanged     |
| Live unauthenticated Gateway     | Discovery returned 401 and Cache-Control no-store; no credentials sent                                 |
| Authenticated live journeys      | NOT RUN — no successful disposable-account/email/ownership/audit smoke evidence                        |
| Browser layout/theme/zoom/motion | NOT VERIFIED — Computer Use stopped because it could not verify the current URL for policy enforcement |

Tests cover all 30 method/path pairs, malformed envelopes/DTOs, safe revisions, all 16 audit projections, cursors, fresh admission, independent read/action denials, versioned role edits, retained creation intents, no-change grants, last-Owner protection, nomination acceptance without demotion, Retry-After without automatic writes, secret scrubbing and StrictMode continuation, acceptance replay recovery, retired continuations, scope retirement, audit cache erasure, field-error focus, and dialog keyboard semantics. jsdom does not prove rendered focus, overflow, zoom, theme rendering, or assistive-technology compliance.

```text
FEATURE: Organization / FEAT-DP-003
STATUS: PARTIAL — implementation and automated checks complete; visual and authenticated live verification pending
FILES CHANGED: src/features/workspaces/** — contracts/API/model/resource UI/tests; src/pages/{WorkspacesPage,WorkspaceOverviewPage,JoinWorkspacePage,AuthPage}.tsx — coordination; src/app/router.tsx and src/lib/routes.ts — approved routing; auth continuation and shared state/header/cache compositions; four approved src/components/ui additions; src/test/** and src/mocks/workspaces.ts — fictional evidence; docs/frontend/** — integration and verification
RULES APPLIED: UI-TKN-01–07, UI-CMP-01–03, UI-LAY-01–06, UI-STA-01–04, UI-FRM-01–06 under the approved connected-feature scope, UI-CNT-01–05, UI-A11Y-01–05, UI-MOT-01–02, UI-DRK-01–02, UI-COD-01–06, UI-FBD-01–03; route/primitive exceptions explicitly approved
STATES VERIFIED: ready / loading / empty / error / success / no-permission — automated evidence
ACCESSIBILITY: RTL labels, field-error focus, keyboard/modal semantics, and token contrast checks pass; browser and screen-reader checks remain open
VALIDATION: all five required commands pass as recorded above
OPEN QUESTIONS: None; operational verification limitations are not passed checks
```

## 12. Local registration and invitation integration — 6 November 2026

Registration now submits the verified three-field Identity contract imperatively, using an anonymous cookie-omitting client. The form validates display name/email/required password, prevents repeated submissions, cancels on departure, ignores stale responses and honors Retry-After. Success clears credentials and asks the recipient to sign in and reopen the original invitation email. No session or membership is established by registration. Both auth screens ignore demo state overrides; sign-up is anonymous-only. Existing invitation proof retirement and same-tab sign-in behavior remain intact.

The frontend fixes Vite at `127.0.0.1:5173` with strictPort. The backend local template and operator's local env now use that exact frontend origin. The failing custom Docker builder override was commented out in the ignored local env; the default builder successfully rebuilt the full stack. Mailpit remains the email provider.

| Check                                                  | Actual result                                                                                                                                                                                                                                                                                                                                         |
| ------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `npm run typecheck`                                    | PASS                                                                                                                                                                                                                                                                                                                                                  |
| `npm run lint`                                         | PASS, including UI conventions and theme contrast checks                                                                                                                                                                                                                                                                                              |
| `npm run format:check`                                 | PASS after matching frontend LF/two-space settings                                                                                                                                                                                                                                                                                                    |
| `npm run test:run`                                     | PASS — 200 tests in 14 files                                                                                                                                                                                                                                                                                                                          |
| `npm run build`                                        | PASS — largest initial chunk 402.90 kB, gzip 124.11 kB                                                                                                                                                                                                                                                                                                |
| Backend `python tools/docs.py validate`                | PASS — 69 artifacts, zero errors                                                                                                                                                                                                                                                                                                                      |
| Backend `scripts/deliverypilot.ps1 up`                 | PASS — full local Docker stack rebuilt and healthy                                                                                                                                                                                                                                                                                                    |
| Local API/Mailpit smoke through Vite `/identity` proxy | PASS — disposable registration/login/workspace creation; issuance gives no membership; captured email uses `http://127.0.0.1:5173/join-workspace`; wrong-account preview denied; recipient preview/accept and alreadyAccepted replay; fresh current-membership read; resend after server cooldown invalidates old proof; decline grants no membership |
| Chrome visual review                                   | Light/dark required-error states inspected; 200% zoom and approximately 317 CSS-pixel width at 300% zoom inspected, including fields and primary action; no horizontal overflow observed                                                                                                                                                              |
| Keyboard/accessibility                                 | Automated labels, error associations, first-invalid focus and auth navigation pass; Chrome theme focus ring visible. No screen-reader certification or complete manual keyboard audit                                                                                                                                                                 |
| Real inbox delivery                                    | NOT ENABLED — Mailpit captures locally; no Resend credentials provisioned                                                                                                                                                                                                                                                                             |
| Remaining live browser coverage                        | Successful browser login/refresh-cookie storage and complete clicked email-to-workspace journey NOT VERIFIED; live smoke used HTTP calls through Vite plus Mailpit, not browser auth automation. Exact 375/768/1024/1440 viewport matrix and reduced-motion emulation not rerun                                                                       |

The one-off smoke created only disposable `invitation-*@example.test` accounts and workspaces named `Disposable invitation integration check`. Test records and captured messages remain; no operator account, workspace, existing message, database volume or source secret was deleted. Credentials and proofs were held in process memory and omitted from the smoke report.

```text
FEATURE: Local registration and workspace invitation integration
STATUS: COMPLETE — implementation and automated/live API checks; browser limits listed above
FILES CHANGED: src/features/auth/AuthForm.tsx, api/registrationApi.ts, model/{registrationForm,useRegistration}.ts, AuthForm.test.tsx — real registration and coverage; src/pages/AuthPage.tsx, src/app/router.tsx and router.test.tsx — connected/anonymous-only registration and removal of preview overrides; src/features/marketing/HomePage.test.tsx and workspaces/recipient/recipientIntegration.test.tsx — regression coverage; vite.config.ts — fixed local port; README.md and docs/frontend/{api-integration,architecture,authentication,organization-integration,testing,verification}.md — setup and evidence. Backend: deploy/env/local.env.example, ignored deploy/env/local.env, docs/Deploy.md, docs/features/FEAT-DP-003-organization/frontend-integration.md — matching origin and current frontend handoff.
RULES APPLIED: UI-TKN-01–07, UI-CMP-01–03, UI-LAY-02/05/06, UI-STA-02–04, UI-FRM-01–03/06, UI-CNT-01–03, UI-A11Y-01–05, UI-DRK-01, UI-COD-01–05, UI-FBD-01–03 under the user's approved connected-registration scope. Existing dependencies, route paths, generated primitives and theme tokens unchanged.
STATES VERIFIED: ready, invalid/empty input, pending, confirmed success, safe conflict/validation/permission/server failure and rate-limited waiting — automated. Light/dark invalid states — browser.
ACCESSIBILITY: Label/error/focus tests and UI contrast checks pass; browser zoom/narrow layout inspected; remaining limits listed above.
VALIDATION: All five frontend commands, backend docs validation, full local Docker up and disposable local API/Mailpit smoke passed.
OPEN QUESTIONS: None. Successful browser auth/cookie and exact viewport-matrix checks remain verification limitations.
```

## 13. Workspace UX refinement — 6 November 2026

The workspace experience now provides loaded-name filtering, a contextual switcher, clearer creation recovery, typed confirmation reason modes, contextual member details, role draft protection, clearer invitation and ownership labels, and simplified audit filters. The [workspace UX plan](../plans/workspaces-ui-ux-improvement.md) records the source audit and roadmap. Existing API contracts and the fresh membership admission boundary remain in force.

| Check                  | Result                                                                                                                                         |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| `npm run typecheck`    | PASS                                                                                                                                           |
| `npm run lint`         | PASS, including UI source and theme contrast checks                                                                                            |
| `npm run format:check` | PASS                                                                                                                                           |
| `npm run test:run`     | PASS — 204 tests in 15 files                                                                                                                   |
| `npm run build`        | PASS — largest initial JavaScript chunk approximately 408 kB                                                                                   |
| Browser review         | NOT PERFORMED — browser access host unavailable; no workspace screenshots, viewport, zoom, theme, touch or screen-reader verification obtained |

Automated tests exercise picker focus, filtering, creation recovery, reason modes and role draft preservation. jsdom does not verify rendered layout or WCAG conformance. Repeat the visual matrix and real assistive-technology checks when browser access is available.
