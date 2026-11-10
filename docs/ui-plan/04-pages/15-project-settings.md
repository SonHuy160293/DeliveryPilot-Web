# Page 15 — Project settings, activation and history

| Item    | Value                                                                                                                                              |
| ------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| Status  | **New, mock-backed.** Route **APPROVED 11 Nov 2026** (`?tab=settings`).                                                                            |
| Route   | `/w/:workspaceSlug/projects/:projectId?tab=settings`                                                                                               |
| Feature | FEAT-DP-004 · FR-004-002, 004, 005 (history readers), 012                                                                                          |
| Roles   | Visible to all member participants (read). Cadence: PA, PM. Engagement/kind: PA + `engagements.manage`, Draft only. Activate: PA. History: PA, PM. |

## 1. Purpose

Configure cadence and engagement, activate the project when ready, and read the change history.

## 2. Wireframe

```
┌ Cadence ───────────────────────────────────────────────────────────┐
│ Framework      Scrum                                                │
│ Sprint length  [2 weeks ▾]   [Save]                                 │
│ A change applies only to Sprints that have not started.             │
└─────────────────────────────────────────────────────────────────────┘
┌ Engagement (Draft only) ───────────────────────────────── [Change] ┐
│ Client project · Halden Logistics — Fleet telemetry MVP (HL-SOW-07) │
│ Fixed once the project is active.                                   │
└─────────────────────────────────────────────────────────────────────┘
┌ Activation  (id="activation") ─────────────────────────────────────┐
│ Status: [Draft]                                                     │
│ ✓ Product Goal written                      Done                    │
│ ✓ Sprint length set                         Done                    │
│ ○ At least one PM on the team               Missing → Go to Team    │
│ ✓ Engagement selected                       Done                    │
│ ○ Client Product Owner assigned             Missing (can be waived) │
│ [Activate project] (disabled while required items missing)          │
│ Activating marks the project ready for delivery. It does not accept │
│ scope or requirements. Active projects can't return to Draft.       │
└─────────────────────────────────────────────────────────────────────┘
┌ History (PA, PM) ──────────────────────────────────────────────────┐
│ When              │ Who       │ Change                   │ Reason   │
│ 4 Nov 2026, 10:02 │ Mai Tran  │ Sprint length 2 → 3 weeks │ —       │
└─────────────────────────────────────────────────────────────────────┘
```

Active projects: Activation card shows "Activated 4 Nov 2026 by Mai Tran" and, if present, "Activated without a client Product Owner. Reason: …" (visible to every participant, OQ-004-18). Engagement card shows read-only text.

## 3. Component tree

```
ProjectSettingsTab { project, permissions }        features/projects/settings/
├─ CadenceCard { sprintLengthWeeks, canEdit }       Select 1–4 + Save (inline form)
├─ EngagementCard { project, canChange }
│  └─ ChangeEngagementDialog: kind Select, engagement Select, Reason (required)
├─ ActivationCard { readiness, canActivate }
│  ├─ ReadinessChecklist
│  └─ ActivateDialog { requiresWaiver } → ReasonField label "Reason for activating without a client Product Owner" (required when waiver)
└─ ProjectHistory { projectId }  (PA, PM only)      ReadState → DataTable<ProjectEvent> + LoadMore
```

## 4. Data

`ProjectDetail` (status, kind, engagement, sprintLengthWeeks, clientPo, activatedAt, activatedBy, clientPoWaiverReason), `ProjectEvent[]` (`project-events.json`). Readiness computed by `computeReadiness(project, brief, participants)` in `features/projects/model/readiness.ts`; the server remains authoritative and returns the full gap list on rejection.

## 5. Actions

| Action                    | Rules                                                                                                                | Result                                                                                                                                |
| ------------------------- | -------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| Save Sprint length        | 1–4                                                                                                                  | "Sprint length set to 3 weeks."                                                                                                       |
| Change engagement         | Draft; PA + `engagements.manage`; Active engagements only; switching to Internal removes engagement; reason required | "Engagement changed." Shared engagement summary auto-withdrawn → extra line "The engagement summary is no longer shared with guests." |
| Activate project          | Draft; PA; all required items done; waiver reason ≤2000 when client PO missing on client project                     | "Project activated."                                                                                                                  |
| Server rejects activation | shows `Alert destructive` listing every gap returned                                                                 | —                                                                                                                                     |

## 6. States

Loading per card; History empty "No changes recorded yet."; Error; Conflict; Success; Read-only users see values without controls; history card hidden for non PA/PM.

## 7. Accessibility

Checklist items announce "Done"/"Missing" as text; "Go to Team" links to `?tab=team`; disabled Activate button has adjacent text explaining why (UI-FRM-03).

## 8. Acceptance criteria

- [ ] No framework selector exists anywhere.
- [ ] Activate enabled only when required items are complete; client PO gap requires waiver text.
- [ ] Engagement card has no controls once Active.
- [ ] History hidden for BA/Dev/QA/DevOps/Viewer.
