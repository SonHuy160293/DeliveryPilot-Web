# Page 05 — Workspace overview and management sections

| Item   | Value                                                                                                                                                                                                                                                     |
| ------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Status | **Existing, connected** (D1) to 30 Identity Gateway operations. Two **proposed** sections added: `client-links` (page 10) and `projects-recovery` (page 16).                                                                                              |
| Route  | `ROUTES.workspaceOverview` → `/w/:workspaceSlug?section=<section>`; sections: overview, members, roles, invitations, ownership, audit                                                                                                                     |
| Files  | `src/pages/WorkspaceOverviewPage.tsx`, `features/workspaces/WorkspaceLanding.tsx`, `components/{WorkspaceAdmission,WorkspacePanels,OwnMembership}.tsx`, `members/*`, `roles/*`, `invitations/*`, `ownership/*`, `audit/*`, `src/lib/workspaceSections.ts` |
| Roles  | Workspace members; each section gated by its read permission                                                                                                                                                                                              |
| Entry  | `/workspaces` → Open workspace; workspace switcher                                                                                                                                                                                                        |
| Exit   | Sidebar to Projects (11), Engagements (08)                                                                                                                                                                                                                |

## 1. Purpose

Workspace home plus Identity administration.

## 2. Wireframe

```
┌ Sidebar (16rem) ─────┬─────────────────────────────────────────────────────┐
│ [Workspace switcher] │ Workspaces › Northwind Delivery Studio               │
│ WORKSPACE            │ Northwind Delivery Studio                            │
│  ▸ Overview          │ ─ Overview: OwnMembership (your roles, joined date)  │
│ DELIVERY (proposed)  │   Quick links: [Projects] [Engagements]              │
│  ▸ Projects          │                                                      │
│  ▸ Engagements       │ section=members  → MembersPanel (table + detail)     │
│ MANAGE               │ section=roles    → RolesPanel (catalog + editor)     │
│  ▸ Members           │ section=invitations → InvitationsPanel + Issue form  │
│  ▸ Roles             │ section=ownership → OwnershipPanel (nominate Owner)  │
│  ▸ Invitations       │ section=audit    → AuditPanel (filters + events)     │
│  ▸ Ownership         │                                                      │
│  ▸ Audit             │                                                      │
│  ▸ Client links (p)  │ section=client-links → page 10                       │
│  ▸ Project recovery (p) │ section=projects-recovery → page 16               │
└──────────────────────┴─────────────────────────────────────────────────────┘
```

## 3. Component tree

```
AppLayout (AppSidebar → SidebarNav)
└─ WorkspaceOverviewPage
   └─ WorkspaceAdmission (fresh membership read; denies on failure)
      └─ WorkspaceLanding
         ├─ PageHeader (breadcrumbs: Workspaces › name)
         └─ WorkspacePanels { section }   lazy panels per section
```

## 4. Data

Existing contracts (`member`, `role`, `invitation`, `nomination`, 16 audit projections). See `features/workspaces/api/contracts.ts`; fixtures for tests in `src/test/fixtures`.

## 5. Actions

Unchanged. Plan additions to the **overview** section only (task T2-16):

| Control            | Visible when                           | Result    |
| ------------------ | -------------------------------------- | --------- |
| "View projects"    | always                                 | → page 11 |
| "View engagements" | caller holds any engagements code (A7) | → page 08 |

## 6. States

Existing: loading, denied (fresh admission failure → "Access unavailable" + Back to workspaces), per-panel read states, write feedback, rate limit.

## 7. Accessibility

Section nav uses `aria-current="page"`; panels have `h2` headings.

## 8. Acceptance criteria (for the additions)

- [ ] New sections appear in `WORKSPACE_SECTIONS` only after OQ-UI-04 approval.
- [ ] Unknown `section` values fall back to overview (existing `readWorkspaceSection`).
