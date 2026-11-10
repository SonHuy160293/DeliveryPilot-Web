# Page 12 — Project overview & brief

| Item    | Value                                                                                          |
| ------- | ---------------------------------------------------------------------------------------------- |
| Status  | **New, mock-backed.** Route **APPROVED 11 Nov 2026** (T0-01) [A2].                             |
| Route   | `ROUTES.workspaceProject` → `/w/:workspaceSlug/projects/:projectId?tab=overview` (default tab) |
| Feature | FEAT-DP-004 · FR-004-003, 007, 012 (read) · FR-025-006 (summary) · US-004-002/003              |
| Roles   | Any active member participant; edit: ProjectAdministrator, ProjectManager, BusinessAnalyst     |
| Entry   | Page 11 card, page 09 projects tab (participants only), create success                         |
| Exit    | Tabs: Team (13), Stakeholders (14), Settings (15), Sharing (18); breadcrumb → page 11          |

## 1. Purpose

Show what the project is for and capture the brief and Product Goal, highlighting missing items.

## 2. Wireframe — desktop

```
┌ Sidebar ┬─────────────────────────────────────────────────────────────────────────┐
│         │ Workspaces › Northwind Delivery Studio › Projects › Fleet telemetry MVP │
│         │ Fleet telemetry MVP  [Draft]  Client project                             │
│         │ Real-time vehicle location and fuel telemetry for Halden's 600 trucks.   │
│         │ Tabs: Overview | Team | Stakeholders | Settings | Sharing                │
│         │ ┌ Callout (Draft + Project admin): 3 setup steps missing  [Review setup] ┐│
│         │ ┌──────────────── Product Goal ─────────────────────────── [Edit] ──────┐│
│         │ │ Dispatchers can see every truck's position within 30 seconds…          ││
│         │ │ Earlier Product Goals (1) ▸                                            ││
│         │ └────────────────────────────────────────────────────────────────────────┘│
│         │ Brief                                                   4 of 6 written     │
│         │ ┌ Problem ──────── [Shared] [Edit] ┐ ┌ Objectives & success criteria [Edit]┐│
│         │ │ Dispatch relies on phone calls…   │ │ Not yet written                    ││
│         │ └───────────────────────────────────┘ └────────────────────────────────────┘│
│         │ (Scope & exclusions, Assumptions, Constraints & dependencies, Open questions)│
│         │ ┌ Engagement summary ───────────────────────────────────────────────────┐ │
│         │ │ Halden Logistics · Fleet telemetry MVP · HL-SOW-07 · [Active]          │ │
│         │ │ Milestones: Pilot depot live 30 Jan 2027 [Planned] …                  │ │
│         │ └───────────────────────────────────────────────────────────────────────┘ │
│         │ Facts: Framework Scrum · Sprint length 2 weeks · Client PO Tomasz Nowak  │
└─────────┴─────────────────────────────────────────────────────────────────────────┘
```

Brief grid: 1 col mobile, 2 cols `md`. Share badges shown only to member participants (FR-015-008).

## 3. Component tree

```
AppLayout
└─ ProjectDetailPage                                 src/pages/ProjectDetailPage.tsx (tab router only)
   ├─ ReadState { query: projectQuery(workspaceId, projectId) }
   ├─ ProjectHeader { project }                       features/projects/components/ProjectHeader.tsx (PageHeader + StatusBadge + kind)
   ├─ ProjectTabs { tab, visibleTabs }               Tabs synced to ?tab=
   └─ ProjectOverviewTab { project, brief, permissions }   features/projects/brief/ProjectOverviewTab.tsx
      ├─ SetupCallout { gaps }                        (Draft + PA)
      ├─ ProductGoalCard { goal, history, canEdit }
      │  └─ EditBriefItemDialog item="ProductGoal"
      ├─ BriefGrid
      │  └─ BriefItemCard { code, label, value, canEdit, shareState? } ×6
      │     └─ EditBriefItemDialog
      ├─ EngagementSummaryCard { summary }            (Client projects; money-free)
      └─ ProjectFacts { framework:"Scrum", sprintLengthWeeks, clientPo }
```

## 4. Data

`ProjectDetail`, `ProjectBrief`, `EngagementSummary` (types in `05-mock-data/types.ts`; samples `projects.json`). Brief item codes and labels:

| Code                           | Label                           |
| ------------------------------ | ------------------------------- |
| `Problem`                      | Problem                         |
| `ObjectivesAndSuccessCriteria` | Objectives and success criteria |
| `ScopeAndExclusions`           | Scope and exclusions            |
| `Assumptions`                  | Assumptions                     |
| `ConstraintsAndDependencies`   | Constraints and dependencies    |
| `OpenQuestions`                | Open questions                  |
| `ProductGoal`                  | Product Goal (separate card)    |

## 5. Actions

| Action                | Visible when                      | Form                                                                            | Result                                                                  |
| --------------------- | --------------------------------- | ------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| Edit (brief item)     | PA, PM, BA                        | Textarea (label = item label), 0–4000, counter; empty allowed                   | "Brief updated." Sends `expectedVersion: brief.version`                 |
| Edit Product Goal     | PA, PM, BA                        | same                                                                            | "Product Goal updated." Old value appears under "Earlier Product Goals" |
| Earlier Product Goals | ≥1 previous value                 | Disclosure `<details>`-style button `aria-expanded`; list value + date + author | —                                                                       |
| Review setup          | Draft + PA                        | → `?tab=settings#activation`                                                    | —                                                                       |
| Engagement name link  | caller has full engagement detail | → page 09                                                                       | —                                                                       |

## 6. States

| State                 | Presentation                                                                                       |
| --------------------- | -------------------------------------------------------------------------------------------------- |
| Loading               | header + 6 card skeletons                                                                          |
| Not found / no access | "This project isn't available. It may not exist, or you may not have access." + "Back to projects" |
| Empty item            | "Not yet written" muted + (editor) "Add" button instead of "Edit"                                  |
| Error                 | ScreenState error + retry                                                                          |
| Conflict              | dialog conflict alert                                                                              |
| Success               | StatusMessage                                                                                      |
| Read-only role        | No Edit buttons; no explanatory noise beyond header role badges                                    |
| Removed mid-session   | Next request 404 → not-available state                                                             |

## 7. Responsive & accessibility

Each brief card `section` with `h3`; edit button `aria-label="Edit Scope and exclusions"`. Long text preserves line breaks (`whitespace-pre-line`). No markdown rendering.

## 8. Acceptance criteria

- [ ] Missing items are labelled "Not yet written" and counted ("4 of 6 written").
- [ ] Developer/QA/DevOps/Viewer see no edit controls.
- [ ] Engagement summary never shows contract value, effort or contacts.
- [ ] Previous Product Goal values are visible to every participant.
