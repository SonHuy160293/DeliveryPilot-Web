# Frontend architecture

## Ownership and dependency direction

This is a feature-first React SPA with a small composition root. Components are functions of props and local interaction state. There are no backend-style repositories, DI containers or empty providers. The authorized API integration adds a stable QueryProvider and a small shared transport layer.

| Directory       | Responsibility                                                  | May depend on                                   |
| --------------- | --------------------------------------------------------------- | ----------------------------------------------- |
| `app`           | Composition and route definitions                               | Pages, layouts, shared UI, query infrastructure |
| `layouts`       | Header, footer, sidebar, topbar, mobile navigation              | Shared UI and route helpers                     |
| `pages`         | Coordinate sections and state for a route                       | Features, shared UI, fixtures                   |
| `features`      | Feature UI, domain API contracts and query/mutation definitions | Shared UI, primitives, shared API/query helpers |
| `components`    | Reusable compositions                                           | Primitives and pure helpers                     |
| `components/ui` | Generated shadcn infrastructure                                 | Radix, class utilities, structural Lucide icons |
| `lib`           | Routes, helpers, API transport and query policy                 | No feature modules                              |
| `mocks`         | Fictional records                                               | No application behavior                         |
| `test`          | Shared DOM setup and route renderer                             | Testing libraries and composition root          |

Avoid circular imports and feature-to-feature dependencies. Promote genuinely shared compositions only when needed. Types stay with their owner. Internal imports use `@/`. Pages and composite components remain within 180 nonblank/noncomment physical lines.

`main.tsx` mounts StrictMode and one stable QueryProvider. `AppRouter` owns browser history; `AppRoutes` owns the actual route tree and can be tested under MemoryRouter. All paths are centralized in `lib/routes.ts`. Auth routes use distinct keys so form credentials clear on variant navigation. BrowserRouter needs the host to rewrite document routes to `index.html` for direct visits and refreshes.

## State and composition

Sign-in and workspace forms use React Hook Form and Zod; registration uses an imperative API call with local outcome state. Workspace discovery and the mounted overview connect to Organization APIs. The creation dialog retains a single name/key intent across closure and uncertain responses, until confirmed or explicitly abandoned. Management panels own their interactions. No global product state exists.

`PageStateGate` renders ready children, supplied empty content, or `ScreenState`; both accept explicit outcome presentation. Existing preview defaults remain for unconnected pages only. Connected workspace views use API-derived read boundaries, real safe errors/retries, and confirmed write outcomes. `usePagePreviewState` is never used by connected workspace screens or either authentication form.

```tsx
<PageStateGate state={state} scope="Workspace overview" empty={emptyContent}>
  <Card>
    <CardContent>Approved feature content</CardContent>
  </Card>
</PageStateGate>
```

Fixture records stay in `mocks/workspaces.ts`; test-only API adapters/harnesses live under `test/fixtures`. A fixture membership label or URL slug is never an identity, permission, or ownership check. Only the manual `deliverypilot-theme` preference persists; light is the default and storage failure is handled gracefully.

## UI infrastructure

`index.css` carries the owner-approved flat warm-neutral and orange theme from the organization portfolio template (11 November 2026): ink `primary`, orange `brand`/`brand-strong`/`accent`, a 0.75rem radius base, and re-toned callout and avatar tokens. Its semantic token names, spacing, type scale, focus, and reduced-motion behavior are unchanged, and `scripts/check-ui.mjs` pins the new hash. Public content uses max-w-6xl, app content max-w-7xl, auth max-w-md. Both shells have skip links, focusable main landmarks, and sticky headers. App navigation uses a 16rem desktop sidebar and Radix Sheet on mobile.

Eleven shadcn new-york/Radix primitives were generated at bootstrap. Organization integration explicitly approved four additions: Tabs, Checkbox, Select, and Textarea. Their inspected templates use existing Radix dependencies and project tokens. Previously generated files, `components.json`, and the theme source remain frozen. No dependencies, decorative imagery, fonts, or decorative motion were added.

## API integration

Read [api-integration.md](api-integration.md) for configuration, verified backend source paths, extension examples, auth limits, query scope, cancellation and tests. Axios owns transport; TanStack Query owns server state; features own runtime-checked contracts, queryOptions, keys and mutationOptions. Shared infrastructure never imports a feature.

QueryProvider owns one stable client per app mount. Requests require an explicit API base and stay inside its URL boundary; redirects are disabled. The shared client uses the memory-only session token. A separate login client enables browser cookie credentials only for the verified login endpoint. Refresh and server logout are unavailable until their contracts exist; see [authentication.md](authentication.md). Registration sends no bearer/cookie credentials, creates no session and keeps credentials outside Query caches. No usable OpenAPI file was available, so Orval is deferred without a fake generation pipeline.

Account and workspace identity form query-key prefixes. Cancel/remove old scope queries before switching, and clear session caches before changing accounts. These are cache operations, not backend authorization. No server-state persistence, Zustand duplication, automatic mutation retries or optimistic writes are introduced. Test-only fixtures demonstrate the complete lifecycle without fictional production endpoints.

React Hook Form and Zod support sign-in and registration; Zustand and charts remain uninstalled.

## Organization ownership and admission

`features/workspaces/api` owns all 30 documented Gateway operations, runtime wire/request schemas, all 16 audit projections, and query definitions. `model` owns safe write lifecycle, field mapping, scoped denial cleanup, and rate-limit waiting; resource folders own management UI. No component contains raw transport and no shared infrastructure imports a feature. The canonical `BlankPage` template remains intact.

`/workspaces` mounts real discovery and personal Owner nominations. `/w/:workspaceSlug` retains its approved pattern but the segment is a validated organization UUID. Entry waits for a fresh own-membership read; the workspace name comes from paginated current discovery. Local tabs load management panels lazily. Catalog reads, delegable permissions, current role badges, and individual action outcomes remain separate from a complete capability map.

`/join-workspace` is the sole new approved route. Bootstrap scrubs the incoming fragment before constructing BrowserRouter and transfers it into a feature-owned ephemeral flow object, rather than retaining secret-bearing React props. The route can continue through sign-in without workspace admission. Proof-bearing preview/accept/decline calls are imperative, outside Query caches; account changes, abandonment, completion, and unmount retire the proof. StrictMode and successful-login cleanup have explicit regression tests. See [Organization integration](organization-integration.md).

## Approved UI plan decisions (11 November 2026)

The owner approved backlog tasks T0-01 and T0-02 of [docs/ui-plan](../ui-plan/README.md):

- **Routes (T0-01).** Approved for addition to `lib/routes.ts`: `workspaceEngagements` `/w/:workspaceSlug/engagements`, `workspaceEngagement` `/w/:workspaceSlug/engagements/:engagementId`, `workspaceProjects` `/w/:workspaceSlug/projects`, `workspaceProject` `/w/:workspaceSlug/projects/:projectId`, `joinProject` `/join-project`, `portal` `/portal`, `portalProject` `/portal/projects/:projectId`; workspace sections `client-links` and `projects-recovery`; project tabs by `?tab=`. The Client Portal is part of this SPA under a `PortalLayout`. ID segments are UUID-validated before any request. The constants are added by task T0-03; until then they are not in `routes.ts`.
- **Mock layer (T0-02).** Engagements, Projects, Sharing and Portal have no Gateway API yet. Their pages use repository interfaces in `features/<feature>/api` with mock implementations backed by `mocks/engagements.ts`, `mocks/projects.ts` and `mocks/portal.ts`. Components use only `queries.ts`. Mock-backed pages show `MockDataBanner` and never present writes as saved to a server. `sharing` and `portal` may import **types only** from `features/projects/api/types.ts`. Each mock repository is swapped for an HTTP repository, and its banner removed, once the endpoint and DTO are verified.

## Product boundaries

The product permits membership in multiple workspaces, one owning workspace per project, and intentionally scoped client access. Version-specific approvals, separate work/QA/acceptance/release states, and human control of delivery commitments remain invariants. This foundation implements no backend enforcement or business workflow.

`docs/product.md` is an unmodified copy of the supplied blueprint. Its linked requirements, architecture, and roadmap were not supplied to this task and were not reviewed. New slices require approved behavior and contracts first.
