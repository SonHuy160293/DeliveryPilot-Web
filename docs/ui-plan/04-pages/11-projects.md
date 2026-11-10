# Page 11 — Projects (portfolio + create)

| Item    | Value                                                                                                                                                                    |
| ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Status  | **New, mock-backed.** Route **APPROVED 11 Nov 2026** (T0-01). No backend yet (G7).                                                                                       |
| Route   | `ROUTES.workspaceProjects` → `/w/:workspaceSlug/projects?status=<status>&kind=<kind>&q=&create=1&engagementId=`; status: Draft, Active, all; kind: Client, Internal, all |
| Feature | FEAT-DP-004 · FR-004-001, 002, 007 · US-DP-004-001                                                                                                                       |
| Design  | Visual language from `docs/design/project-portfolio/design-spec.md`; **excluding** health, Kanban/hybrid, sprint progress and story counts (G4, OQ-UI-03)                |
| Roles   | Any workspace member (list shows only own participations); create needs `organization.projects.create`                                                                   |
| Entry   | Sidebar "Projects"; workspace overview; page 09 "Create project" (`?create=1&engagementId=`)                                                                             |
| Exit    | Card → page 12; create success → page 12 of new project                                                                                                                  |

## 1. Purpose

List the projects the caller participates in and start a new Scrum project.

## 2. Wireframe — desktop

```
┌ Sidebar ┬───────────────────────────────────────────────────────────────────────┐
│         │ Workspaces › Northwind Delivery Studio › Projects                     │
│         │ Projects                                            [Create project]  │
│         │ Projects you take part in. Other projects in this workspace are not shown. │
│         │ MockDataBanner                                                        │
│         │ FilterBar: Search [Project name…] Status [All ▾] Kind [All ▾]  3 projects │
│         │ ┌ ProjectCard ───────────────┐ ┌ ProjectCard ───────────────┐ ┌ …   │
│         │ │ Loyalty platform – Phase 1  │ │ Fleet telemetry MVP        │       │
│         │ │ [Active] Client project     │ │ [Draft] Client project     │       │
│         │ │ Larkspur Retail Group       │ │ Halden Logistics           │       │
│         │ │ Sprint length  2 weeks      │ │ Sprint length  2 weeks     │       │
│         │ │ Your roles  PM · BA         │ │ Your roles  Project admin  │       │
│         │ │ [Open project]              │ │ 3 setup steps missing      │       │
│         │ └─────────────────────────────┘ │ [Open project]             │       │
│         │                                 └────────────────────────────┘       │
└─────────┴───────────────────────────────────────────────────────────────────────┘
```

Grid: 1 col <768, 2 cols `md`, 3 cols `xl`. Mobile filters collapse into a `Sheet` "Filters" button with active-count badge.

## 3. Component tree

```
AppLayout
└─ ProjectsPage                                    src/pages/ProjectsPage.tsx
   ├─ PageHeader { title:"Projects", action:<CreateProjectDialog/> (if projects.create) }
   ├─ MockDataBanner, StatusMessage
   ├─ FilterBar { search, filters:[status, kind], resultCount }
   └─ ReadState { query: myProjectsQuery(workspaceId) }
      └─ ProjectGrid { projects: ProjectListItem[] }         features/projects/components/ProjectGrid.tsx
         └─ ProjectCard { project }                           features/projects/components/ProjectCard.tsx
CreateProjectDialog { workspaceId, defaultEngagementId? }    features/projects/components/CreateProjectDialog.tsx
   └─ FormDialog
      ├─ FormField name, TextareaField purpose
      ├─ Fieldset "Project type" Checkbox-free radio pattern via Select: Client project | Internal project
      └─ EngagementSelect { workspaceId }   (Client only) lists Active engagements with full detail
```

## 4. Data

`ProjectListItem` (`05-mock-data/types.ts`):

```json
{
  "id": "019a4000-0000-7000-8000-000000000001",
  "name": "Loyalty platform – Phase 1",
  "purpose": "Replace the legacy points engine and launch the new member app for Larkspur stores.",
  "kind": "Client",
  "status": "Active",
  "engagement": {
    "id": "019a3000-0000-7000-8000-000000000001",
    "clientDisplayName": "Larkspur Retail Group",
    "engagementName": "Loyalty platform rebuild"
  },
  "sprintLengthWeeks": 2,
  "myRoles": ["ProjectManager", "BusinessAnalyst"],
  "myParticipantKind": "Member",
  "missingSetupCount": 0,
  "hasActiveAdministrator": true,
  "createdAt": "2026-09-20T03:15:00Z"
}
```

`missingSetupCount` is computed client-side from the readiness rule (BR-UI-09) only for Draft projects when the caller is Project Administrator [ASSUMPTION: list endpoint returns the fields needed; else omit the line].

Role labels: ProjectAdministrator → "Project admin", ProjectManager → "PM", BusinessAnalyst → "BA", Developer → "Developer", QualityAssurance → "QA", DevOps → "DevOps", Viewer → "Viewer".

## 5. Actions & form

| Control        | Visible when      | Result                                    |
| -------------- | ----------------- | ----------------------------------------- |
| Create project | `projects.create` | Dialog; `?create=1` opens it on load      |
| Filters/search | always            | URL-synced; client-side over loaded items |
| Open project   | always            | → page 12                                 |

**Create project form**

| Field        | Type / control                                       | Required                                                                               | Rules                                                                                                                       | Error                                                              |
| ------------ | ---------------------------------------------------- | -------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| Project name | Input `prj-name`                                     | yes                                                                                    | trim 1–160; duplicates allowed                                                                                              | "Enter a project name." / "Use 160 characters or fewer."           |
| Purpose      | Textarea `prj-purpose` + counter                     | yes                                                                                    | trim 1–500                                                                                                                  | "Describe the project's purpose." / "Use 500 characters or fewer." |
| Project type | Select `prj-kind`: Client project / Internal project | yes (default Client when `engagementId` param or any engagement exists, else Internal) | —                                                                                                                           | —                                                                  |
| Engagement   | Select `prj-engagement`                              | when Client                                                                            | Active engagements visible with full detail; option label "Larkspur Retail Group — Loyalty platform rebuild (LRG-2026-014)" | "Choose the engagement this project delivers."                     |

Static line in dialog: "Framework: Scrum. Sprint length starts at 2 weeks; you can change it later." No framework selector (BR-UI-06).

If the caller has no engagement visibility: Client option disabled with help "You need engagement read access to create a client project. Create an internal project or ask an Admin." Closed engagement chosen meanwhile → server error "This engagement is closed. Choose an active engagement."

Success → navigate page 12 `?tab=overview`, `StatusMessage` "Project created. You are its project administrator."

## 6. States

| State          | Presentation                                                                                                                    |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| Loading        | 6 skeleton cards                                                                                                                |
| Empty          | "You're not in any project yet" / "Projects appear here when you create one or a project admin adds you." + Create (if allowed) |
| Filtered empty | "No projects match these filters." + Clear filters                                                                              |
| Error          | ScreenState error + retry; 503 → "We couldn't confirm your access right now."                                                   |
| No-permission  | workspace admission denied (existing)                                                                                           |
| Edge           | Project flagged `hasActiveAdministrator=false` shows `StatusBadge attention` "No active administrator"                          |

## 7. Responsive & accessibility

Cards are `<article>` with `h3` name; whole card not clickable — explicit "Open project" link (`aria-label="Open project Loyalty platform – Phase 1"`). Grid `role="list"`.

## 8. Acceptance criteria

- [ ] Only projects with an active participation of the caller appear; workspace Owner without participation sees none.
- [ ] No health, progress, Kanban or story counts appear.
- [ ] Client project cannot be submitted without an Active engagement.
- [ ] Opening from page 09 preselects the engagement and Client type.
