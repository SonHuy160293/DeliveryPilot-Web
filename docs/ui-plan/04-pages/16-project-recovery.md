# Page 16 — Project recovery (workspace Owner)

| Item    | Value                                                                |
| ------- | -------------------------------------------------------------------- |
| Status  | **New, mock-backed.** Section **APPROVED 11 Nov 2026** (T0-01) [A5]. |
| Route   | `/w/:workspaceSlug?section=projects-recovery`                        |
| Feature | FEAT-DP-004 · FR-004-013 (recovery)                                  |
| Roles   | Workspace Owner only                                                 |

## 1. Purpose

Let an Owner appoint a Project Administrator for a project whose administrators all lost workspace membership, **without** the Owner gaining project content access.

## 2. Wireframe

```
Project recovery
Projects listed here have no active administrator. Appointing one does not
give you access to the project.
┌──────────────────────────────────────────────────────────────┐
│ Project                │ Status │                            │
│ Warehouse scanner app  │ Active │ [Appoint administrator]    │
└──────────────────────────────────────────────────────────────┘

Dialog: Appoint administrator — Warehouse scanner app
  Member participant  [Select: Arjun Mehta (Developer) ▾]
  Reason              [______________________________] (required)
  [Cancel] [Appoint administrator]
```

## 3. Component tree

```
WorkspacePanels section="projects-recovery"
└─ ProjectRecoveryPanel { workspaceId }              features/projects/recovery/
   ├─ SectionHeading
   ├─ ReadState → DataTable<OrphanedProject>
   └─ AppointAdministratorDialog { project, candidates } (FormDialog)
```

## 4. Data

```ts
OrphanedProject { id; name; status: "Draft" | "Active"; candidates: { participantId; displayName | null; roles: RoleCode[] }[] }
```

## 5. Actions

Appoint → "Arjun Mehta is now an administrator of Warehouse scanner app." Candidates empty → dialog body "No team member is left to appoint. The project stays without an administrator." and no submit. Active admin exists meanwhile → "This project has an administrator again. No change was made."

## 6. States

Loading; Empty "Every project has an active administrator."; Error; No-permission (non-Owner): nav hidden, direct URL message "Only workspace Owners can recover projects."

## 8. Acceptance criteria

- [ ] Only name and status are shown; no project content.
- [ ] Reason is required.
- [ ] After appointing, the Owner does not see the project in page 11 (unless already a participant).
