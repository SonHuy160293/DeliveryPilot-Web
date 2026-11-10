# Page 14 — Project stakeholders

| Item    | Value                                                                       |
| ------- | --------------------------------------------------------------------------- |
| Status  | **New, mock-backed.** Route **APPROVED 11 Nov 2026** (`?tab=stakeholders`). |
| Route   | `/w/:workspaceSlug/projects/:projectId?tab=stakeholders`                    |
| Feature | FEAT-DP-004 · FR-004-011 · FR-015-003 (share state badge)                   |
| Roles   | Read: all member participants. Edit: PA, PM.                                |

## 1. Purpose

Record who matters to the project and what they decide — a basic register (no RACI, calendar or kickoff, OQ-004-11). Entries grant no access.

## 2. Wireframe

```
Stakeholders (4)                                         [Add stakeholder]
Stakeholder entries are a record only. They don't give anyone access.
FilterBar: Side [All ▾]   [ ] Show retired
┌──────────────────────────────────────────────────────────────────────────────┐
│ Name           │ Side   │ Organization          │ Decision areas          │ Shared │     │
│ Tomasz Nowak   │ Client │ Larkspur Retail Group │ Scope priority, UAT     │ Shared │ [Edit] │
│ Priya Raman    │ Client │ Larkspur Retail Group │ Budget                  │ Internal │ [Edit] │
│ Mai Tran       │ Vendor │ Northwind Delivery…   │ Staffing, escalation    │ Internal │ [Edit] │
└──────────────────────────────────────────────────────────────────────────────┘
Row expand (button "Show details") → Responsibilities, Email, Linked participant
```

## 3. Component tree

```
ProjectStakeholdersTab { projectId, permissions }       features/projects/stakeholders/
├─ SectionHeading + Add button
├─ FilterBar { filters:[side], toggle showRetired (Checkbox) }
├─ ReadState → DataTable<Stakeholder>
│  └─ StakeholderDetails (disclosure)
├─ StakeholderDialog { mode:"create"|"edit", participants }
└─ ConfirmAction "Retire stakeholder"
```

## 4. Data

`Stakeholder` (`types.ts`), sample `stakeholders.json`.

## 5. Form

| Field              | Control                                       | Required | Rules                                                                                   |
| ------------------ | --------------------------------------------- | -------- | --------------------------------------------------------------------------------------- |
| Name               | Input                                         | yes      | trim 1–200                                                                              |
| Side               | Select Vendor / Client                        | yes      | —                                                                                       |
| Organization       | Input                                         | no       | ≤200                                                                                    |
| Responsibilities   | Textarea                                      | no       | ≤2000                                                                                   |
| Decision areas     | Textarea                                      | no       | ≤2000                                                                                   |
| Email              | Input type=email                              | no       | email format                                                                            |
| Linked team member | Select (active participants + guests, "None") | no       | linking a non-participant rejected → "Choose someone on the team, or leave this empty." |

Retire: ConfirmAction consequence "The entry stays in history. If it is shared with the client, sharing ends." → "Stakeholder retired."

## 6. States

Loading; Empty "No stakeholders recorded" / "Add the people who make or influence decisions on this project."; Error; Success; Read-only roles: no Add/Edit; Retired rows (when toggled) show `StatusBadge ended` "Retired" and no actions.

## 7–8. Accessibility & acceptance

- [ ] Shared column visible only to member participants; text not icon only.
- [ ] Retiring a shared entry changes its badge to Internal (share withdrawn).
- [ ] Email column never shown in the guest portal (page 19).
