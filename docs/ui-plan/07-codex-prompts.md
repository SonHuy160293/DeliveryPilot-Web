# 07 — Codex implementation prompts

Run these prompts **in order**, one Codex task per prompt. Each prompt is one reviewable change. Codex reads `AGENTS.md` automatically; every prompt still names the files it must read, because the plan lives in `docs/ui-plan/`.

## How to use

1. Do **step 0** yourself before the first prompt.
2. Paste one prompt into Codex. Wait for its completion report.
3. Review the diff and run the app (`npm run dev`) for the pages it touched.
4. Commit, then paste the next prompt. Do not run two prompts in parallel: later prompts depend on files created by earlier ones.
5. If Codex returns a `UI DECISION REQUIRED` block, answer it before continuing. Add the answer to `docs/frontend/architecture.md` so later prompts see it.

| Step | Prompt                                   | Backlog tasks                     | Size |
| ---- | ---------------------------------------- | --------------------------------- | ---- |
| 0    | Clean baseline (you)                     | —                                 | S    |
| 1    | Routes and placeholder pages             | T0-03, T0-04                      | M    |
| 2    | Navigation and portal layout             | T0-05, T0-06, T2-16, T2-17        | M    |
| 3    | Promote shared components and formatters | T1-01, T1-07                      | M    |
| 4    | Mock runtime and new shared compositions | T0-07, T1-02…T1-06                | L    |
| 5    | Engagements API layer and list page      | T2-01, T2-02                      | L    |
| 6    | Engagement detail                        | T2-03, T2-04                      | L    |
| 7    | Projects API layer and portfolio         | T2-05, T2-06                      | L    |
| 8    | Project overview and brief               | T2-07                             | M    |
| 9    | Project team                             | T2-08                             | L    |
| 10   | Project settings and activation          | T2-09, T2-22                      | M    |
| 11   | Join project                             | T2-10                             | M    |
| 12   | Stakeholders and client sharing          | T2-15, T2-11, T2-12               | L    |
| 13   | Client portal                            | T2-13, T2-14                      | L    |
| 14   | Contract-pending engagement features     | T2-18, T2-19, T2-20, T2-21, T2-23 | L    |

## Step 0 — clean baseline (do this yourself)

- Commit or stash the current uncommitted work in `src/` so each Codex diff contains only its own changes.
- `npm run format:check` currently fails on 6 files that pre-date the plan: `DESIGN.md`, `docs/design/project-portfolio/design-spec.md`, `scripts/check-ui.mjs`, `src/features/marketing/DeliveryRecord.tsx`, `src/features/workspaces/components/PortfolioToolbar.tsx`, `src/features/workspaces/components/WorkspaceCreateTile.tsx`. Run `npx prettier --write` on them and commit, otherwise every Codex run reports a failing check it did not cause.
- Confirm `npm run typecheck && npm run lint && npm run format:check && npm run test:run && npm run build` passes.

## Shared rules (already in every prompt below)

Each prompt ends with the same block. It is repeated so each prompt can be pasted alone.

```text
RULES FOR THIS TASK
- Follow AGENTS.md, docs/ui/UI-RULES.md, docs/ui/AGENT-BRIEF.md and docs/frontend/architecture.md.
  The UI plan in docs/ui-plan/ never overrides them.
- Do not add dependencies, change package.json/lockfile, src/index.css, components.json or
  src/components/ui/*. Do not add routes beyond those approved in docs/frontend/architecture.md.
- Use only existing shadcn primitives and Lucide icons already used in the repo. Semantic tokens only.
- Pages and compositions stay within 180 nonblank/noncomment lines; split otherwise.
- No `any`, no `@ts-ignore`, no raw colors, no arbitrary Tailwind values, no inline styles.
- Components never import repositories or fixtures; they use the feature's queries.ts.
- Mock-backed pages render MockDataBanner and never claim data was saved to a server.
- Use exact UI copy from the page spec. If a spec and the rules conflict, or something is missing,
  stop that part and return the UI-ESC-01 block; continue with independent work.
- Colocate tests (*.test.tsx). Cover ready, loading, empty, error, success and no-permission from
  repository outcomes (never ?state=).
- Run: npm run typecheck, npm run lint, npm run format:check, npm run test:run, npm run build.
  Report actual results. Do not commit.
- Finish with the AGENT-BRIEF completion report.
```

---

## Prompt 1 — Routes and placeholder pages

```text
Implement backlog tasks T0-03 and T0-04 from docs/ui-plan/06-implementation-backlog.md.

READ FIRST
- docs/frontend/architecture.md, section "Approved UI plan decisions (11 November 2026)"
- docs/ui-plan/02-sitemap-and-flows.md §2 (route table) and §3 (navigation)
- src/lib/routes.ts, src/lib/workspaceSections.ts, src/app/router.tsx, src/app/router.test.tsx,
  src/pages/BlankPage.tsx, src/pages/NotFoundPage.tsx

DO
1. In src/lib/routes.ts add the approved constants exactly:
   workspaceEngagements "/w/:workspaceSlug/engagements"
   workspaceEngagement  "/w/:workspaceSlug/engagements/:engagementId"
   workspaceProjects    "/w/:workspaceSlug/projects"
   workspaceProject     "/w/:workspaceSlug/projects/:projectId"
   joinProject          "/join-project"
   portal               "/portal"
   portalProject        "/portal/projects/:projectId"
   Add path helpers using generatePath: workspaceEngagementsPath(workspaceId),
   workspaceEngagementPath(workspaceId, engagementId), workspaceProjectsPath(workspaceId),
   workspaceProjectPath(workspaceId, projectId, tab?), portalProjectPath(projectId).
   Add an isUuid(value) helper reusing the regex already used by isWorkspaceOverviewPath.
2. Create src/lib/projectTabs.ts mirroring src/lib/workspaceSections.ts:
   PROJECT_TAB_PARAM = "tab"; tabs overview, team, stakeholders, settings, sharing (labels:
   Overview, Team, Stakeholders, Settings, Sharing); readProjectTab, projectTabSearch.
   Create the same kind of helper for engagement tabs in src/lib/engagementTabs.ts:
   details, contract, milestones, contacts, projects, client-link, history.
3. Add "client-links" (label "Client links") and "projects-recovery" (label "Project recovery")
   to WORKSPACE_SECTIONS. WorkspacePanels must render a placeholder EmptyState for both for now.
4. Create placeholder pages copied from the BlankPage composition (PageHeader with breadcrumb,
   PageStateGate, explicit placeholder copy) for: EngagementsPage, EngagementDetailPage,
   ProjectsPage, ProjectDetailPage, JoinProjectPage, PortalHomePage, PortalProjectPage.
   Titles: "Engagements", "Engagement", "Projects", "Project", "Join a project", "My projects",
   "Project". Use the breadcrumbs in docs/ui-plan/02-sitemap-and-flows.md §3.
5. Register the routes in src/app/router.tsx. Workspace routes go inside AppLayout behind the same
   auth guard as /w/:workspaceSlug; /join-project goes in PublicLayout like /join-workspace;
   /portal routes go inside AppLayout for now (PortalLayout comes in prompt 2).
   If engagementId/projectId is not a UUID, render NotFoundPage without any request.
6. Tests: routes.test.ts for helpers and UUID guard; extend router.test.tsx so every new path
   renders its page heading, and an invalid ID renders "Page not found".

OUT OF SCOPE: navigation links, real content, mocks.

ACCEPTANCE
- All 7 routes render; invalid IDs show the not-found page.
- No string literal paths outside routes.ts.

RULES FOR THIS TASK
- Follow AGENTS.md, docs/ui/UI-RULES.md, docs/ui/AGENT-BRIEF.md and docs/frontend/architecture.md.
  The UI plan in docs/ui-plan/ never overrides them.
- Do not add dependencies, change package.json/lockfile, src/index.css, components.json or
  src/components/ui/*. Do not add routes beyond those approved in docs/frontend/architecture.md.
- Use only existing shadcn primitives and Lucide icons already used in the repo. Semantic tokens only.
- Pages and compositions stay within 180 nonblank/noncomment lines; split otherwise.
- No `any`, no `@ts-ignore`, no raw colors, no arbitrary Tailwind values, no inline styles.
- Components never import repositories or fixtures; they use the feature's queries.ts.
- Mock-backed pages render MockDataBanner and never claim data was saved to a server.
- Use exact UI copy from the page spec. If a spec and the rules conflict, or something is missing,
  stop that part and return the UI-ESC-01 block; continue with independent work.
- Colocate tests (*.test.tsx). Cover ready, loading, empty, error, success and no-permission from
  repository outcomes (never ?state=).
- Run: npm run typecheck, npm run lint, npm run format:check, npm run test:run, npm run build.
  Report actual results. Do not commit.
- Finish with the AGENT-BRIEF completion report.
```

## Prompt 2 — Navigation and portal layout

```text
Implement backlog tasks T0-05, T0-06, T2-16 and T2-17 from docs/ui-plan/06-implementation-backlog.md.

READ FIRST
- docs/ui-plan/02-sitemap-and-flows.md §3 (navigation table)
- docs/ui-plan/04-pages/05-workspace-overview.md §5 and docs/ui-plan/04-pages/19-client-portal.md §2a
- src/layouts/AppLayout.tsx, AppSidebar.tsx, SidebarNav.tsx, src/components/UserAccountMenu.tsx,
  src/features/workspaces/WorkspaceLanding.tsx, components/OwnMembership.tsx, components/RoleBadges.tsx,
  src/features/workspaces/api/queries.ts (current membership and roles reads)

DO
1. Sidebar inside a workspace: add a "Delivery" group with "Projects" (always) and "Engagements"
   (only when the caller holds organization.engagements.create, read-all or manage — derive from the
   existing roles/permission reads; hide while unknown). Add "Client links" (Owner or Admin) and
   "Project recovery" (Owner) to the Manage group, linking to the new sections.
   Use aria-current for the active item. Keep keyboard and mobile Sheet behavior.
2. Account menu: add "Client portal" linking to ROUTES.portal.
3. Workspace overview section: add "View projects" (always) and "View engagements" (same rule as
   the sidebar) links, as Button variant="outline" asChild Link.
4. Create src/layouts/PortalLayout.tsx: same shell pattern as AppLayout (skip link, sticky header,
   theme toggle, account menu, focusable main), no workspace switcher, one nav item "My projects"
   → ROUTES.portal. Move the /portal routes under it.
5. Tests for visibility rules (Owner, Admin, Member without codes, member with read-all) and
   keyboard reachability of the new items.

OUT OF SCOPE: page content.

ACCEPTANCE
- A Member with no engagement codes never sees "Engagements"; non-Owners never see "Project recovery".
- Navigation works at 320px through the Sheet.

RULES FOR THIS TASK
- Follow AGENTS.md, docs/ui/UI-RULES.md, docs/ui/AGENT-BRIEF.md and docs/frontend/architecture.md.
  The UI plan in docs/ui-plan/ never overrides them.
- Do not add dependencies, change package.json/lockfile, src/index.css, components.json or
  src/components/ui/*. Do not add routes beyond those approved in docs/frontend/architecture.md.
- Use only existing shadcn primitives and Lucide icons already used in the repo. Semantic tokens only.
- Pages and compositions stay within 180 nonblank/noncomment lines; split otherwise.
- No `any`, no `@ts-ignore`, no raw colors, no arbitrary Tailwind values, no inline styles.
- Components never import repositories or fixtures; they use the feature's queries.ts.
- Mock-backed pages render MockDataBanner and never claim data was saved to a server.
- Use exact UI copy from the page spec. If a spec and the rules conflict, or something is missing,
  stop that part and return the UI-ESC-01 block; continue with independent work.
- Colocate tests (*.test.tsx). Cover ready, loading, empty, error, success and no-permission from
  repository outcomes (never ?state=).
- Run: npm run typecheck, npm run lint, npm run format:check, npm run test:run, npm run build.
  Report actual results. Do not commit.
- Finish with the AGENT-BRIEF completion report.
```

## Prompt 3 — Promote shared components and formatters

```text
Implement backlog tasks T1-01 and T1-07 from docs/ui-plan/06-implementation-backlog.md.

READ FIRST
- docs/ui-plan/03-design-system.md §3 (promotion rule) and §5
- src/features/workspaces/components/{ReadState,ConfirmAction,FormField,ApiFeedback,RetryDelay}.tsx
- src/features/workspaces/model/formatters.ts

DO
1. Move ReadState (with LoadMore), ConfirmAction, FormField (with TextareaField), ApiFeedback (with
   RefreshButton) and RetryDelay from src/features/workspaces/components/ to src/components/ with
   NO API or behavior change. Update every importer. Move their tests with them. Any helper they
   import from features/workspaces must move to src/lib or src/components too, so that
   src/components never imports a feature.
2. Create src/lib/format.ts: formatDate("2026-11-02") → "2 Nov 2026" (UTC);
   formatInstant(iso) → "2 Nov 2026, 14:05" in local time; formatMoney(185000, "AUD") →
   "AUD 185,000.00" via Intl.NumberFormat("en-US", {style:"currency", currencyDisplay:"code"})
   (the separator after the code may be a no-break space; tests must allow it); formatPersonDays(420) →
   "420.0 person-days"; formatCount via Intl.NumberFormat("en-US"). Reuse the existing date
   formatter logic from features/workspaces/model/formatters.ts; make that file re-export or call
   the new one so there is one implementation.
3. Tests for every formatter, including null → "Not recorded" helpers.

OUT OF SCOPE: new components.

ACCEPTANCE
- git diff for the moved components shows only path/import changes.
- All existing workspace tests pass unchanged except import paths.

RULES FOR THIS TASK
- Follow AGENTS.md, docs/ui/UI-RULES.md, docs/ui/AGENT-BRIEF.md and docs/frontend/architecture.md.
  The UI plan in docs/ui-plan/ never overrides them.
- Do not add dependencies, change package.json/lockfile, src/index.css, components.json or
  src/components/ui/*. Do not add routes beyond those approved in docs/frontend/architecture.md.
- Use only existing shadcn primitives and Lucide icons already used in the repo. Semantic tokens only.
- Pages and compositions stay within 180 nonblank/noncomment lines; split otherwise.
- No `any`, no `@ts-ignore`, no raw colors, no arbitrary Tailwind values, no inline styles.
- Components never import repositories or fixtures; they use the feature's queries.ts.
- Mock-backed pages render MockDataBanner and never claim data was saved to a server.
- Use exact UI copy from the page spec. If a spec and the rules conflict, or something is missing,
  stop that part and return the UI-ESC-01 block; continue with independent work.
- Colocate tests (*.test.tsx). Cover ready, loading, empty, error, success and no-permission from
  repository outcomes (never ?state=).
- Run: npm run typecheck, npm run lint, npm run format:check, npm run test:run, npm run build.
  Report actual results. Do not commit.
- Finish with the AGENT-BRIEF completion report.
```

## Prompt 4 — Mock runtime and new shared compositions

```text
Implement backlog tasks T0-07 and T1-02 to T1-06 from docs/ui-plan/06-implementation-backlog.md.

READ FIRST
- docs/ui-plan/03-design-system.md §4 (all component specs) and §6
- docs/ui-plan/05-mock-data/repositories.md §2 (mock behavior contract, including the persona rule)
- docs/ui-plan/05-mock-data/users.json, workspaces.json
- src/lib/api/apiError.ts, src/lib/api/errorNormalizer.ts

DO
1. src/mocks/mockRuntime.ts: delay(ms = 400); persona handling (default persona "u-linh" for
   workspace surfaces, "u-tomasz" for the portal; test-only __setMockPersona(key) and
   __resetMocks()); test-only __setMockFailure(operation, kind); helpers that throw ApiError with
   the same kinds errorNormalizer produces for 403, 404, 409, 422 (field errors), 429, 5xx.
   Copy users.json and workspaces.json records into src/mocks/people.ts as typed constants.
   Nothing in mockRuntime may be reachable from a URL or UI control.
2. Build in src/components/: StatusBadge (+ src/lib/statusTone.ts), DataTable, FilterBar
   (+ src/lib/useSearchParamState.ts), FormDialog, ReasonField, StatusMessage, MockDataBanner,
   PersonCell, DefinitionList, ReadinessChecklist — props, states and copy exactly as in
   03-design-system.md §4. DataTable renders a semantic table from md and stacked Cards below md.
3. One test file per component: accessibility roles/labels, keyboard, every state in its spec table.
   FormDialog tests: blur validation, server field error, 409 conflict alert with Reload,
   dirty-close confirmation, focus returns to trigger.

OUT OF SCOPE: feature pages.

ACCEPTANCE
- Every StatusBadge label from §4.2 renders text, not only color.
- No component imports from src/features or src/mocks.

RULES FOR THIS TASK
- Follow AGENTS.md, docs/ui/UI-RULES.md, docs/ui/AGENT-BRIEF.md and docs/frontend/architecture.md.
  The UI plan in docs/ui-plan/ never overrides them.
- Do not add dependencies, change package.json/lockfile, src/index.css, components.json or
  src/components/ui/*. Do not add routes beyond those approved in docs/frontend/architecture.md.
- Use only existing shadcn primitives and Lucide icons already used in the repo. Semantic tokens only.
- Pages and compositions stay within 180 nonblank/noncomment lines; split otherwise.
- No `any`, no `@ts-ignore`, no raw colors, no arbitrary Tailwind values, no inline styles.
- Components never import repositories or fixtures; they use the feature's queries.ts.
- Mock-backed pages render MockDataBanner and never claim data was saved to a server.
- Use exact UI copy from the page spec. If a spec and the rules conflict, or something is missing,
  stop that part and return the UI-ESC-01 block; continue with independent work.
- Colocate tests (*.test.tsx). Cover ready, loading, empty, error, success and no-permission from
  repository outcomes (never ?state=).
- Run: npm run typecheck, npm run lint, npm run format:check, npm run test:run, npm run build.
  Report actual results. Do not commit.
- Finish with the AGENT-BRIEF completion report.
```

## Prompt 5 — Engagements API layer and list page

```text
Implement backlog tasks T2-01 and T2-02 from docs/ui-plan/06-implementation-backlog.md.

READ FIRST
- docs/ui-plan/04-pages/08-engagements.md (whole spec)
- docs/ui-plan/05-mock-data/types.md "Engagement — FEAT-DP-025" and repositories.md §1–§4
- docs/ui-plan/05-mock-data/engagements.json, engagement-history.json
- docs/ui-plan/01-requirements.md §4 (BR-UI-01…03, 13–15) and §6.1
- src/features/workspaces/api/{contracts,queries}.ts and model/useWorkspaceCreation.ts (patterns)

DO
1. src/features/engagements/api/: types.ts (copy the Engagement types), contracts.ts (Zod schemas
   matching them), engagementRepository.ts (interface + getEngagementRepository()),
   mockEngagementRepository.ts, queries.ts (keys per repositories.md §4, scoped like the
   existing queryScope helpers). src/mocks/engagements.ts holds the fixtures from the JSON files.
   The mock enforces: the permission matrix in 01-requirements.md §6.1 for the current persona,
   field limits from FR-025-001, expectedVersion conflicts, duplicate-reference flag on create,
   idempotent create per idempotency key, and status filter + cursor paging (page size 50).
2. Page 08 exactly as specified: EngagementsPage, EngagementTable, CreateEngagementDialog, FilterBar
   with URL-synced status and search, LoadMore, MockDataBanner, all states in §6.
   After create, navigate to workspaceEngagementPath and pass the duplicate flag in navigation
   state (page 09 shows the alert in prompt 6; for now the placeholder may ignore it).
3. Tests: contract parse of every fixture; mock permission denials; page states; create flow
   including validation (201-char name, http:// link) and duplicate warning.

ACCEPTANCE: docs/ui-plan/04-pages/08-engagements.md §8.

RULES FOR THIS TASK
- Follow AGENTS.md, docs/ui/UI-RULES.md, docs/ui/AGENT-BRIEF.md and docs/frontend/architecture.md.
  The UI plan in docs/ui-plan/ never overrides them.
- Do not add dependencies, change package.json/lockfile, src/index.css, components.json or
  src/components/ui/*. Do not add routes beyond those approved in docs/frontend/architecture.md.
- Use only existing shadcn primitives and Lucide icons already used in the repo. Semantic tokens only.
- Pages and compositions stay within 180 nonblank/noncomment lines; split otherwise.
- No `any`, no `@ts-ignore`, no raw colors, no arbitrary Tailwind values, no inline styles.
- Components never import repositories or fixtures; they use the feature's queries.ts.
- Mock-backed pages render MockDataBanner and never claim data was saved to a server.
- Use exact UI copy from the page spec. If a spec and the rules conflict, or something is missing,
  stop that part and return the UI-ESC-01 block; continue with independent work.
- Colocate tests (*.test.tsx). Cover ready, loading, empty, error, success and no-permission from
  repository outcomes (never ?state=).
- Run: npm run typecheck, npm run lint, npm run format:check, npm run test:run, npm run build.
  Report actual results. Do not commit.
- Finish with the AGENT-BRIEF completion report.
```

## Prompt 6 — Engagement detail

```text
Implement backlog tasks T2-03 and T2-04 from docs/ui-plan/06-implementation-backlog.md.

READ FIRST
- docs/ui-plan/04-pages/09-engagement-detail.md (whole spec)
- docs/ui-plan/01-requirements.md §4 (BR-UI-03…05, 14) and §5 (milestone lifecycle)
- src/features/engagements/ (from prompt 5), src/lib/engagementTabs.ts

DO
1. EngagementDetailPage with header, header actions (Create project link → workspaceProjectsPath
   with ?create=1&engagementId=; Close/Reopen with required reason), duplicate-reference Alert from
   navigation state, Closed notice, Tabs synced to ?tab= (use replace navigation).
2. Tabs in this prompt: Details (read-only for now; no Edit button), Contract (ContractValueDialog
   with the currency-lock rule and "Clear amount and currency"), Milestones (add, edit, change date
   with required reason, change status offering only allowed transitions; Achieved/Retired rows
   have no actions), History (paged, eventType label map with "Engagement updated" fallback).
   Contacts, Client link and Projects tabs render a "Coming soon in this preview" EmptyState
   placeholder — they are built in prompt 14.
3. Extend the mock repository with get, history, setContractValue, close, reopen and the four
   milestone operations, all with expectedVersion and transition rules.
4. Tests: every action's success and failure, Closed read-only (no edit control reachable by
   keyboard), conflict reload, read-all user sees no edit controls, not-found state.

ACCEPTANCE: docs/ui-plan/04-pages/09-engagement-detail.md §8 (except contract-pending items).

RULES FOR THIS TASK
- Follow AGENTS.md, docs/ui/UI-RULES.md, docs/ui/AGENT-BRIEF.md and docs/frontend/architecture.md.
  The UI plan in docs/ui-plan/ never overrides them.
- Do not add dependencies, change package.json/lockfile, src/index.css, components.json or
  src/components/ui/*. Do not add routes beyond those approved in docs/frontend/architecture.md.
- Use only existing shadcn primitives and Lucide icons already used in the repo. Semantic tokens only.
- Pages and compositions stay within 180 nonblank/noncomment lines; split otherwise.
- No `any`, no `@ts-ignore`, no raw colors, no arbitrary Tailwind values, no inline styles.
- Components never import repositories or fixtures; they use the feature's queries.ts.
- Mock-backed pages render MockDataBanner and never claim data was saved to a server.
- Use exact UI copy from the page spec. If a spec and the rules conflict, or something is missing,
  stop that part and return the UI-ESC-01 block; continue with independent work.
- Colocate tests (*.test.tsx). Cover ready, loading, empty, error, success and no-permission from
  repository outcomes (never ?state=).
- Run: npm run typecheck, npm run lint, npm run format:check, npm run test:run, npm run build.
  Report actual results. Do not commit.
- Finish with the AGENT-BRIEF completion report.
```

## Prompt 7 — Projects API layer and portfolio

```text
Implement backlog tasks T2-05 and T2-06 from docs/ui-plan/06-implementation-backlog.md.

READ FIRST
- docs/ui-plan/04-pages/11-projects.md (whole spec)
- docs/ui-plan/05-mock-data/types.md "Project — FEAT-DP-004" and repositories.md (ProjectRepository)
- docs/ui-plan/05-mock-data/projects.json, participants.json, guest-invitations.json,
  stakeholders.json, project-events.json, client-links-and-recovery.json (orphanedProjects)
- docs/ui-plan/01-requirements.md §4 (BR-UI-06…10) and §6.2

DO
1. src/features/projects/api/: types.ts, contracts.ts, projectRepository.ts,
   mockProjectRepository.ts, queries.ts; src/mocks/projects.ts. Implement the full
   ProjectRepository interface in the mock now (later prompts only add UI), enforcing:
   list only projects where the persona has an active participation; not-found for others;
   role matrix §6.2; last-administrator protection; one pending invitation per email; guest
   roles exclude ProjectAdministrator; readiness rules for activation (return the full gap list);
   expectedVersion conflicts; client project requires an Active engagement (read engagements
   through the engagements feature's TYPES only — call the engagement mock through a small
   adapter passed in from src/mocks, not a feature import).
   Add src/features/projects/model/readiness.ts and roleLabels.ts (labels in page 11 §4).
2. Page 11 exactly as specified: ProjectsPage, ProjectGrid, ProjectCard, CreateProjectDialog with
   EngagementSelect, ?create=1&engagementId= handling, filters, all states. No health, progress,
   Kanban or story counts.
3. Tests: mock rules above; page states; create client and internal projects; Client option
   disabled without engagement visibility; preselection from page 09 link.

ACCEPTANCE: docs/ui-plan/04-pages/11-projects.md §8.

RULES FOR THIS TASK
- Follow AGENTS.md, docs/ui/UI-RULES.md, docs/ui/AGENT-BRIEF.md and docs/frontend/architecture.md.
  The UI plan in docs/ui-plan/ never overrides them.
- Do not add dependencies, change package.json/lockfile, src/index.css, components.json or
  src/components/ui/*. Do not add routes beyond those approved in docs/frontend/architecture.md.
- Use only existing shadcn primitives and Lucide icons already used in the repo. Semantic tokens only.
- Pages and compositions stay within 180 nonblank/noncomment lines; split otherwise.
- No `any`, no `@ts-ignore`, no raw colors, no arbitrary Tailwind values, no inline styles.
- Components never import repositories or fixtures; they use the feature's queries.ts.
- Mock-backed pages render MockDataBanner and never claim data was saved to a server.
- Use exact UI copy from the page spec. If a spec and the rules conflict, or something is missing,
  stop that part and return the UI-ESC-01 block; continue with independent work.
- Colocate tests (*.test.tsx). Cover ready, loading, empty, error, success and no-permission from
  repository outcomes (never ?state=).
- Run: npm run typecheck, npm run lint, npm run format:check, npm run test:run, npm run build.
  Report actual results. Do not commit.
- Finish with the AGENT-BRIEF completion report.
```

## Prompt 8 — Project overview and brief

```text
Implement backlog task T2-07 from docs/ui-plan/06-implementation-backlog.md.

READ FIRST
- docs/ui-plan/04-pages/12-project-overview.md (whole spec)
- src/features/projects/ (from prompt 7), src/lib/projectTabs.ts

DO
1. ProjectDetailPage as the tab router: ProjectHeader (PageHeader + StatusBadge + kind), ProjectTabs
   synced to ?tab=. Show the Sharing tab only when permissions.share; Settings for all member
   participants. Tabs other than Overview render a placeholder until their prompt.
2. ProjectOverviewTab: SetupCallout (Draft + Project admin, gap count from readiness.ts, link to
   ?tab=settings), ProductGoalCard with "Earlier Product Goals" disclosure, BriefGrid with six
   BriefItemCards ("Not yet written", "4 of 6 written"), EditBriefItemDialog (0–4000, counter,
   expectedVersion), EngagementSummaryCard (money-free: client name, engagement name, reference,
   status, milestones), ProjectFacts ("Framework: Scrum").
   Share badges on brief cards are added in prompt 12; leave a prop for them.
3. Tests: editor vs read-only roles, missing items, Product Goal history, summary never shows
   amount/effort/contacts, not-found state, conflict.

ACCEPTANCE: docs/ui-plan/04-pages/12-project-overview.md §8.

RULES FOR THIS TASK
- Follow AGENTS.md, docs/ui/UI-RULES.md, docs/ui/AGENT-BRIEF.md and docs/frontend/architecture.md.
  The UI plan in docs/ui-plan/ never overrides them.
- Do not add dependencies, change package.json/lockfile, src/index.css, components.json or
  src/components/ui/*. Do not add routes beyond those approved in docs/frontend/architecture.md.
- Use only existing shadcn primitives and Lucide icons already used in the repo. Semantic tokens only.
- Pages and compositions stay within 180 nonblank/noncomment lines; split otherwise.
- No `any`, no `@ts-ignore`, no raw colors, no arbitrary Tailwind values, no inline styles.
- Components never import repositories or fixtures; they use the feature's queries.ts.
- Mock-backed pages render MockDataBanner and never claim data was saved to a server.
- Use exact UI copy from the page spec. If a spec and the rules conflict, or something is missing,
  stop that part and return the UI-ESC-01 block; continue with independent work.
- Colocate tests (*.test.tsx). Cover ready, loading, empty, error, success and no-permission from
  repository outcomes (never ?state=).
- Run: npm run typecheck, npm run lint, npm run format:check, npm run test:run, npm run build.
  Report actual results. Do not commit.
- Finish with the AGENT-BRIEF completion report.
```

## Prompt 9 — Project team

```text
Implement backlog task T2-08 from docs/ui-plan/06-implementation-backlog.md.

READ FIRST
- docs/ui-plan/04-pages/13-project-team.md (whole spec, especially the §5 action table and copy)
- src/features/projects/ (prompts 7–8)

DO
1. ProjectTeamTab: ClientPoCard + AssignClientPoDialog (active guests only, "Engagement default"
   marker when the engagement's ClientProductOwner contact email matches), team DataTable with
   PersonCell, role badges, kind, "Manage" Dialog (change roles, make/remove project admin for PA
   on members only, remove member / revoke guest), AddParticipantDialog (workspace members from the
   existing members read — if the caller cannot read members, show the help text from the spec and
   disable the action), RoleChecklist (fieldset/legend), InviteGuestDialog, pending invitations with
   Resend/Cancel, LeaveProjectButton for guests.
2. Every action and message exactly as page 13 §5, including last-admin and duplicate-invite errors.
3. Tests: PM vs PA vs read-only visibility; each action success and error; revoking the client PO
   guest clears the card; Project admin never offered for guests or invitations.

ACCEPTANCE: docs/ui-plan/04-pages/13-project-team.md §8.

RULES FOR THIS TASK
- Follow AGENTS.md, docs/ui/UI-RULES.md, docs/ui/AGENT-BRIEF.md and docs/frontend/architecture.md.
  The UI plan in docs/ui-plan/ never overrides them.
- Do not add dependencies, change package.json/lockfile, src/index.css, components.json or
  src/components/ui/*. Do not add routes beyond those approved in docs/frontend/architecture.md.
- Use only existing shadcn primitives and Lucide icons already used in the repo. Semantic tokens only.
- Pages and compositions stay within 180 nonblank/noncomment lines; split otherwise.
- No `any`, no `@ts-ignore`, no raw colors, no arbitrary Tailwind values, no inline styles.
- Components never import repositories or fixtures; they use the feature's queries.ts.
- Mock-backed pages render MockDataBanner and never claim data was saved to a server.
- Use exact UI copy from the page spec. If a spec and the rules conflict, or something is missing,
  stop that part and return the UI-ESC-01 block; continue with independent work.
- Colocate tests (*.test.tsx). Cover ready, loading, empty, error, success and no-permission from
  repository outcomes (never ?state=).
- Run: npm run typecheck, npm run lint, npm run format:check, npm run test:run, npm run build.
  Report actual results. Do not commit.
- Finish with the AGENT-BRIEF completion report.
```

## Prompt 10 — Project settings and activation

```text
Implement backlog tasks T2-09 and T2-22 from docs/ui-plan/06-implementation-backlog.md.

READ FIRST
- docs/ui-plan/04-pages/15-project-settings.md (whole spec)
- docs/ui-plan/01-requirements.md BR-UI-07, BR-UI-09
- src/features/projects/ (prompts 7–9)

DO
1. ProjectSettingsTab: CadenceCard (Select 1–4 weeks, help text), EngagementCard with
   ChangeEngagementDialog (Draft only, PA + organization.engagements.manage, kind and engagement,
   required reason; switching to Internal clears the engagement), ActivationCard with
   ReadinessChecklist and ActivateDialog (waiver reason required only when the client PO is the
   only gap), server gap list on rejection, activated summary and waiver reason for Active
   projects, ProjectHistory (PA and member PM only).
2. The "id=activation" anchor must work from the overview callout.
3. Tests: activation enabled/disabled per checklist; waiver path; engagement card read-only once
   Active; history hidden for BA/Developer/QA/DevOps/Viewer.

ACCEPTANCE: docs/ui-plan/04-pages/15-project-settings.md §8.

RULES FOR THIS TASK
- Follow AGENTS.md, docs/ui/UI-RULES.md, docs/ui/AGENT-BRIEF.md and docs/frontend/architecture.md.
  The UI plan in docs/ui-plan/ never overrides them.
- Do not add dependencies, change package.json/lockfile, src/index.css, components.json or
  src/components/ui/*. Do not add routes beyond those approved in docs/frontend/architecture.md.
- Use only existing shadcn primitives and Lucide icons already used in the repo. Semantic tokens only.
- Pages and compositions stay within 180 nonblank/noncomment lines; split otherwise.
- No `any`, no `@ts-ignore`, no raw colors, no arbitrary Tailwind values, no inline styles.
- Components never import repositories or fixtures; they use the feature's queries.ts.
- Mock-backed pages render MockDataBanner and never claim data was saved to a server.
- Use exact UI copy from the page spec. If a spec and the rules conflict, or something is missing,
  stop that part and return the UI-ESC-01 block; continue with independent work.
- Colocate tests (*.test.tsx). Cover ready, loading, empty, error, success and no-permission from
  repository outcomes (never ?state=).
- Run: npm run typecheck, npm run lint, npm run format:check, npm run test:run, npm run build.
  Report actual results. Do not commit.
- Finish with the AGENT-BRIEF completion report.
```

## Prompt 11 — Join project

```text
Implement backlog task T2-10 from docs/ui-plan/06-implementation-backlog.md.

READ FIRST
- docs/ui-plan/04-pages/17-join-project.md (whole spec)
- docs/ui-plan/04-pages/06-join-workspace.md and docs/frontend/organization-integration.md
- src/main.tsx (fragment scrubbing), src/features/workspaces/recipient/* and
  recipientIntegration.test.tsx — mirror this design exactly

DO
1. Extend bootstrap so /join-project#<proof> is scrubbed from the address bar before the router
   renders and moved into a feature-owned ephemeral flow object, exactly like /join-workspace.
   The proof never enters React props, Query caches, storage or logs.
2. src/features/projects/guest-invitations/recipient/: flow boundary, JoinProjectInvitation,
   ProjectInvitationResponseRepository (+ mock using guest-invitations.json recipientPreview;
   proof value for the mock is any non-empty string; persona "u-grace" matches the invited email).
3. JoinProjectPage with every situation in spec §5–6 and exact copy; accept navigates to
   portalProjectPath; sign-in continuation resumes the flow.
4. Tests mirroring recipientIntegration.test.tsx: StrictMode, account change, unmount, completion
   retire the proof; each error situation.

ACCEPTANCE: docs/ui-plan/04-pages/17-join-project.md §8.

RULES FOR THIS TASK
- Follow AGENTS.md, docs/ui/UI-RULES.md, docs/ui/AGENT-BRIEF.md and docs/frontend/architecture.md.
  The UI plan in docs/ui-plan/ never overrides them.
- Do not add dependencies, change package.json/lockfile, src/index.css, components.json or
  src/components/ui/*. Do not add routes beyond those approved in docs/frontend/architecture.md.
- Use only existing shadcn primitives and Lucide icons already used in the repo. Semantic tokens only.
- Pages and compositions stay within 180 nonblank/noncomment lines; split otherwise.
- No `any`, no `@ts-ignore`, no raw colors, no arbitrary Tailwind values, no inline styles.
- Components never import repositories or fixtures; they use the feature's queries.ts.
- Mock-backed pages render MockDataBanner and never claim data was saved to a server.
- Use exact UI copy from the page spec. If a spec and the rules conflict, or something is missing,
  stop that part and return the UI-ESC-01 block; continue with independent work.
- Colocate tests (*.test.tsx). Cover ready, loading, empty, error, success and no-permission from
  repository outcomes (never ?state=).
- Run: npm run typecheck, npm run lint, npm run format:check, npm run test:run, npm run build.
  Report actual results. Do not commit.
- Finish with the AGENT-BRIEF completion report.
```

## Prompt 12 — Stakeholders and client sharing

```text
Implement backlog tasks T2-15, T2-11 and T2-12 from docs/ui-plan/06-implementation-backlog.md.

READ FIRST
- docs/ui-plan/04-pages/14-project-stakeholders.md and 18-project-sharing.md (whole specs)
- docs/ui-plan/05-mock-data/types.md "Sharing and portal", shares.json, stakeholders.json
- docs/ui-plan/01-requirements.md BR-UI-12

DO
1. Stakeholders tab: list with side filter and "Show retired", details disclosure, StakeholderDialog
   (create/edit), retire with ConfirmAction, "Shared"/"Internal" column for member participants.
2. src/features/sharing/: SharingRepository interface + mock (src/mocks/portal.ts holds shares),
   queries.ts. Mock rules: Product Goal is never shareable; engagement summary only for client
   projects with an engagement and only when the persona has full engagement detail; retiring a
   stakeholder withdraws its share; concurrent share/withdraw resolves to one final state; every
   change appends a ShareEvent. Import project types only (type-only import from
   features/projects/api/types.ts, as approved).
3. Sharing tab (PA and member PM only): DefaultViewNote, three ShareGroups, Share (no confirm),
   Withdraw (optional reason), SharingHistory, and a "Preview as client" toggle that is a
   placeholder until prompt 13 provides PortalProjectView.
4. Wire share badges into the overview BriefItemCards (prompt 8 prop) for member participants.
5. Tests per both specs' §8.

ACCEPTANCE: §8 of pages 14 and 18 (preview part completed in prompt 13).

RULES FOR THIS TASK
- Follow AGENTS.md, docs/ui/UI-RULES.md, docs/ui/AGENT-BRIEF.md and docs/frontend/architecture.md.
  The UI plan in docs/ui-plan/ never overrides them.
- Do not add dependencies, change package.json/lockfile, src/index.css, components.json or
  src/components/ui/*. Do not add routes beyond those approved in docs/frontend/architecture.md.
- Use only existing shadcn primitives and Lucide icons already used in the repo. Semantic tokens only.
- Pages and compositions stay within 180 nonblank/noncomment lines; split otherwise.
- No `any`, no `@ts-ignore`, no raw colors, no arbitrary Tailwind values, no inline styles.
- Components never import repositories or fixtures; they use the feature's queries.ts.
- Mock-backed pages render MockDataBanner and never claim data was saved to a server.
- Use exact UI copy from the page spec. If a spec and the rules conflict, or something is missing,
  stop that part and return the UI-ESC-01 block; continue with independent work.
- Colocate tests (*.test.tsx). Cover ready, loading, empty, error, success and no-permission from
  repository outcomes (never ?state=).
- Run: npm run typecheck, npm run lint, npm run format:check, npm run test:run, npm run build.
  Report actual results. Do not commit.
- Finish with the AGENT-BRIEF completion report.
```

## Prompt 13 — Client portal

```text
Implement backlog tasks T2-13 and T2-14 from docs/ui-plan/06-implementation-backlog.md.

READ FIRST
- docs/ui-plan/04-pages/19-client-portal.md (whole spec)
- docs/ui-plan/05-mock-data/portal.json, types.md (GuestProjectListItem, GuestProjectView)
- docs/ui-plan/01-requirements.md BR-UI-12, BR-UI-13
- src/layouts/PortalLayout.tsx (prompt 2), src/features/sharing/ (prompt 12)

DO
1. src/features/portal/: PortalRepository + mock. The mock builds GuestProjectView ONLY from the
   persona's active guest participations and the CURRENT shares from the sharing mock, so a
   withdrawal in the vendor UI is visible in the portal on next load. Unknown or non-guest
   project IDs → not-found.
2. PortalHomePage (GuestProjectCard grid, empty state) and PortalProjectPage (PortalProjectView:
   facts, Product Goal, TeamList, SharedItems, guest PM/BA role-granted brief editing, Leave project).
3. Replace the Sharing tab preview placeholder with PortalProjectView in read-only preview mode
   under the banner "Preview — this is what guests of this project see."
4. A "forbidden fields" test that renders the portal and the preview and asserts none of these
   appear: vendor workspace name, any email, contract amount/currency, planned effort, contacts,
   milestone change reasons, activation waiver reason, pending invitations, "No active administrator".

ACCEPTANCE: docs/ui-plan/04-pages/19-client-portal.md §8 and page 18 preview criterion.

RULES FOR THIS TASK
- Follow AGENTS.md, docs/ui/UI-RULES.md, docs/ui/AGENT-BRIEF.md and docs/frontend/architecture.md.
  The UI plan in docs/ui-plan/ never overrides them.
- Do not add dependencies, change package.json/lockfile, src/index.css, components.json or
  src/components/ui/*. Do not add routes beyond those approved in docs/frontend/architecture.md.
- Use only existing shadcn primitives and Lucide icons already used in the repo. Semantic tokens only.
- Pages and compositions stay within 180 nonblank/noncomment lines; split otherwise.
- No `any`, no `@ts-ignore`, no raw colors, no arbitrary Tailwind values, no inline styles.
- Components never import repositories or fixtures; they use the feature's queries.ts.
- Mock-backed pages render MockDataBanner and never claim data was saved to a server.
- Use exact UI copy from the page spec. If a spec and the rules conflict, or something is missing,
  stop that part and return the UI-ESC-01 block; continue with independent work.
- Colocate tests (*.test.tsx). Cover ready, loading, empty, error, success and no-permission from
  repository outcomes (never ?state=).
- Run: npm run typecheck, npm run lint, npm run format:check, npm run test:run, npm run build.
  Report actual results. Do not commit.
- Finish with the AGENT-BRIEF completion report.
```

## Prompt 14 — Contract-pending engagement features and project recovery

```text
Implement backlog tasks T2-18, T2-19, T2-20, T2-21 and T2-23 from docs/ui-plan/06-implementation-backlog.md.
These features have no backend endpoint yet; they are mock-only and must stay behind MockDataBanner.

READ FIRST
- docs/ui-plan/04-pages/09-engagement-detail.md §5 rows marked [pending], link code panel, §6
- docs/ui-plan/04-pages/10-client-links.md and 16-project-recovery.md (whole specs)
- docs/ui-plan/05-mock-data/client-links-and-recovery.json

DO
1. Engagement detail: Edit details dialog (reason required when agreement reference or signed date
   changes), Contacts tab (add/edit/remove, single client PO designation with the replacement
   message), Client link tab (issue code shown once with Copy; afterwards only "Code outstanding"
   and expiry; remove link allowed when Closed), Projects tab (name/status/administrators; link only
   when the persona participates).
   The issued code must not be stored in any Query cache — keep it in component state and clear it
   when the panel is dismissed or the page unmounts.
2. Workspace section client-links (page 10): code form, preview dialog, linked list, remove;
   one generic failure message for every invalid code; 429 countdown; Owner/Admin only.
   Mock: the code "7KQ4-MZ2P-H9TD" is valid; everything else fails generically.
3. Workspace section projects-recovery (page 16): Owner only, list, AppointAdministratorDialog with
   required reason, empty-candidates message.
4. Tests for each spec's §8.

ACCEPTANCE: §8 of pages 09 (remaining items), 10 and 16.

RULES FOR THIS TASK
- Follow AGENTS.md, docs/ui/UI-RULES.md, docs/ui/AGENT-BRIEF.md and docs/frontend/architecture.md.
  The UI plan in docs/ui-plan/ never overrides them.
- Do not add dependencies, change package.json/lockfile, src/index.css, components.json or
  src/components/ui/*. Do not add routes beyond those approved in docs/frontend/architecture.md.
- Use only existing shadcn primitives and Lucide icons already used in the repo. Semantic tokens only.
- Pages and compositions stay within 180 nonblank/noncomment lines; split otherwise.
- No `any`, no `@ts-ignore`, no raw colors, no arbitrary Tailwind values, no inline styles.
- Components never import repositories or fixtures; they use the feature's queries.ts.
- Mock-backed pages render MockDataBanner and never claim data was saved to a server.
- Use exact UI copy from the page spec. If a spec and the rules conflict, or something is missing,
  stop that part and return the UI-ESC-01 block; continue with independent work.
- Colocate tests (*.test.tsx). Cover ready, loading, empty, error, success and no-permission from
  repository outcomes (never ?state=).
- Run: npm run typecheck, npm run lint, npm run format:check, npm run test:run, npm run build.
  Report actual results. Do not commit.
- Finish with the AGENT-BRIEF completion report.
```

## After all prompts

- Walk the main journey in the browser as persona `u-linh`: create engagement → add milestone → create client project → brief + Product Goal → add PM → invite guest → share two items → open portal as `u-tomasz` → withdraw one item → confirm it disappears.
- Check 320 / 768 / 1440 px and dark mode on pages 08, 09, 11, 12, 13 and 19.
- When a backend endpoint lands, follow `05-mock-data/repositories.md` §5 (swap checklist) — one prompt per repository.
