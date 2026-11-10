# Page 04 — Workspaces portfolio

| Item   | Value                                                                                                                                                                                                                                                                                |
| ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Status | **Existing, connected** (D1): `GET /me/organizations`, `POST /organizations`, `GET/POST /me/ownership-nominations…`                                                                                                                                                                  |
| Route  | `ROUTES.workspaces` → `/workspaces`                                                                                                                                                                                                                                                  |
| Files  | `src/pages/WorkspacesPage.tsx`, `features/workspaces/components/{WorkspacePortfolio,WorkspaceCollection,OrganizationCard,OrganizationSearch,PortfolioStats,PortfolioToolbar,StatusFilter,WorkspaceCreateTile}.tsx`, `WorkspaceCreateDialog.tsx`, `ownership/PersonalNominations.tsx` |
| Design | `docs/design/organization-portfolio/design-spec.md` (+ desktop/mobile PNGs)                                                                                                                                                                                                          |
| Roles  | Any signed-in user                                                                                                                                                                                                                                                                   |
| Entry  | Sign-in success, logo in app shell, "Back to workspaces"                                                                                                                                                                                                                             |
| Exit   | "Open workspace" → `/w/:id`; account menu → "Client portal" (`/portal`, proposed)                                                                                                                                                                                                    |

## 1. Purpose

List the workspaces the user belongs to, create a workspace, respond to personal Owner nominations.

## 2. Wireframe

```
┌ Sidebar ┬──────────────────────────────────────────────────────────────┐
│         │ Workspaces                                     [Create workspace] │
│         │ PortfolioStats: [Workspaces 3] [Owner of 1] [Pending nominations 1] │
│         │ PortfolioToolbar: [Search…] [Filter by role ▾] [Sort ▾] [⟳]   │
│         │ ┌ OrganizationCard ┐ ┌ OrganizationCard ┐ ┌ CreateTile ┐       │
│         │ │ Northwind…       │ │ Larkspur…        │ │  + Create  │       │
│         │ │ Owner  Admin     │ │ Member           │ │ workspace  │       │
│         │ │ [Open workspace] │ │ [Open workspace] │ └────────────┘       │
│         │ └──────────────────┘ └──────────────────┘                      │
│         │ PersonalNominations: "You were nominated as Owner of …" [Accept] [Decline] │
└─────────┴──────────────────────────────────────────────────────────────┘
```

## 3. Component tree

```
AppLayout
└─ WorkspacesPage
   ├─ PageHeader title="Workspaces" action=<WorkspaceCreateDialog/>
   ├─ WorkspacePortfolio
   │  ├─ PortfolioStats, PortfolioToolbar (OrganizationSearch, StatusFilter)
   │  └─ WorkspaceCollection → OrganizationCard[] + WorkspaceCreateTile
   └─ PersonalNominations → NominationList → NominationActions
```

## 4. Data (wire contract, `features/workspaces/api/contracts.ts`)

```json
{
  "organizationId": "019a1000-0000-7000-8000-000000000001",
  "name": "Northwind Delivery Studio",
  "roles": [{ "id": "…", "code": "owner", "name": "Owner" }],
  "membershipId": "…",
  "version": 3,
  "membershipVersion": 2
}
```

## 5. Actions

| Action                      | Result                                                                                  |
| --------------------------- | --------------------------------------------------------------------------------------- |
| Create workspace            | Dialog: Name (1–160, required) → created, opens `/w/:id`. Retry-safe creation recovery. |
| Open workspace              | Fresh `members/me` read, then navigate.                                                 |
| Accept / decline nomination | `ConfirmAction`; result refreshes list.                                                 |

## 6. States

Loading skeleton cards; Empty "You're not in a workspace yet" + Create; Error with retry; per-card denied cleanup; Rate-limit countdown.

## 7–8. Responsive, a11y, acceptance

Unchanged from `docs/plans/workspaces-ui-ux-improvement.md`. Plan additions: none, except account menu item "Client portal" (task T2-17).
