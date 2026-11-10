# Page 13 — Project team, guests and client PO

| Item    | Value                                                                                        |
| ------- | -------------------------------------------------------------------------------------------- |
| Status  | **New, mock-backed.** Route **APPROVED 11 Nov 2026** (`?tab=team` on page 12 route).         |
| Route   | `/w/:workspaceSlug/projects/:projectId?tab=team`                                             |
| Feature | FEAT-DP-004 · FR-004-005, 006, 008, 009, 010, 013 · US-004-004…009                           |
| Roles   | Read: all participants. Manage members & guests: PA, member PM. Client PO & admins: PA only. |
| Entry   | Project tabs                                                                                 |
| Exit    | Same page                                                                                    |

## 1. Purpose

Manage who works on the project, with which project roles, which client guests are admitted or invited, and who the client Product Owner is.

## 2. Wireframe — desktop

```
Tabs: Overview | Team | Stakeholders | Settings | Sharing
┌ Client Product Owner ─────────────────────────────────────────── [Change] ┐
│ (TN) Tomasz Nowak · Guest · assigned 2 Oct 2026                           │
│  or: "No client Product Owner assigned."  [Assign client PO]              │
└──────────────────────────────────────────────────────────────────────────┘
Team (6)                                      [Add team member] [Invite guest]
┌──────────────────────────────────────────────────────────────────────────┐
│ Person                 │ Type   │ Roles                    │ Since      │      │
│ (MT) Mai Tran          │ Member │ Project admin · PM       │ 20 Sep 2026│ [Manage ▾] │
│ (SR) Sofia Reyes       │ Member │ BA                       │ 21 Sep 2026│ [Manage ▾] │
│ (TN) Tomasz Nowak      │ Guest  │ Viewer · Client PO       │ 2 Oct 2026 │ [Manage ▾] │
└──────────────────────────────────────────────────────────────────────────┘
Pending guest invitations (1)
┌──────────────────────────────────────────────────────────────────────────┐
│ grace.liu@larkspur.example │ BA │ Expires 18 Nov 2026 │ [Resend] [Cancel] │
└──────────────────────────────────────────────────────────────────────────┘
(guest viewer only) [Leave project]
```

"Manage ▾" is a `Button outline` that opens a `Dialog` "Manage <name>" (no dropdown primitive approved, OQ-UI-06) containing: Change roles, Make project admin / Remove project admin (PA only, members only), Remove from project / Revoke guest access.

## 3. Component tree

```
ProjectTeamTab { project, permissions }                   features/projects/team/ProjectTeamTab.tsx
├─ ClientPoCard { assignment, canAssign, guests, engagementDefaultEmail }
│  └─ AssignClientPoDialog (Select of active guests; "Engagement default" marker)
├─ SectionHeading "Team" + actions
├─ ReadState → DataTable<Participant>
│  └─ PersonCell, RoleBadges, StatusBadge(kind), ManageParticipantDialog
├─ AddParticipantDialog { workspaceMembers }   member search Select + RoleChecklist
├─ InviteGuestDialog                            email + role Select (no Project admin)
├─ GuestInvitationList → DataTable<GuestInvitation> + Resend/Cancel ConfirmAction
└─ LeaveProjectButton (guest only, ConfirmAction)
RoleChecklist { value: RoleCode[], allowAdministrator: boolean, forGuest: boolean }   fieldset+legend "Project roles"
```

## 4. Data

`Participant`, `GuestInvitation`, `ClientPoAssignment`, `WorkspaceMemberOption` (from existing members read — only `displayName`, `primaryEmail`, `userId`). Samples `participants.json`, `guest-invitations.json`.

## 5. Actions & forms

| Action                        | Who    | Fields / rules                                                                                                                                    | Result / error copy                                                                                                                                                                                                                                                                                              |
| ----------------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Add team member               | PA, PM | Member (Select of active workspace members not already active participants); Roles ≥1 (Project admin option only if caller is PA)                 | "Sofia Reyes added to the team." / duplicate → "This person is already on the team." / not a member → "This person isn't an active member of the workspace."                                                                                                                                                     |
| Change roles                  | PA, PM | RoleChecklist ≥1; guests: no Project admin; PM cannot add/remove Project admin                                                                    | "Roles updated." Removing all roles → validation "Choose at least one role. To remove the person, use Remove from project."                                                                                                                                                                                      |
| Make / remove project admin   | PA     | members only; last admin protection                                                                                                               | "A project needs at least one administrator. Make someone else an administrator first."                                                                                                                                                                                                                          |
| Remove from project (member)  | PA, PM | ConfirmAction reasonMode=optional, consequence "They lose access to this project on their next action. Their past work stays attributed to them." | "Removed from the project."                                                                                                                                                                                                                                                                                      |
| Invite guest                  | PA, PM | Email (required, email format, ≤320), Role (Select: PM, BA, Developer, QA, DevOps, Viewer)                                                        | "Invitation sent to grace.liu@larkspur.example. It expires in 7 days." / pending duplicate → "This person already has a pending invitation." / workspace member → "This person is a workspace member. Add them as a team member instead." [ASSUMPTION: server signals this at issue; FR states it at acceptance] |
| Resend invitation             | PA, PM | ConfirmAction consequence "The previous link stops working and a new 7-day link is sent."                                                         | "Invitation resent."                                                                                                                                                                                                                                                                                             |
| Cancel invitation             | PA, PM | ConfirmAction                                                                                                                                     | "Invitation cancelled."                                                                                                                                                                                                                                                                                          |
| Change offered role (pending) | PA, PM | Not editable; help: "To offer a different role, cancel and send a new invitation."                                                                | —                                                                                                                                                                                                                                                                                                                |
| Revoke guest                  | PA, PM | ConfirmAction reasonMode=optional; if client PO: extra line "Tomasz Nowak is the client Product Owner. Revoking also removes that assignment."    | "Guest access revoked."                                                                                                                                                                                                                                                                                          |
| Assign / change client PO     | PA     | Select of active guests                                                                                                                           | "Tomasz Nowak is now the client Product Owner."                                                                                                                                                                                                                                                                  |
| Remove client PO              | PA     | ConfirmAction                                                                                                                                     | "Client Product Owner removed."                                                                                                                                                                                                                                                                                  |
| Leave project                 | Guest  | ConfirmAction consequence "You will lose access to this project immediately."                                                                     | navigates to `/portal`                                                                                                                                                                                                                                                                                           |

## 6. States

Loading table skeleton; Empty pending invitations "No pending invitations."; Team never empty (creator is PA) — if name lookup fails: PersonCell "Name unavailable"; Error retry; Conflict; 429 issuance limit → "You've sent several invitations recently. Try again in 1 minute."; No-permission: management buttons hidden for read-only roles.

## 7. Responsive & accessibility

Role checklist uses `<fieldset><legend>Project roles</legend>` with `Checkbox` + `Label`; invitation expiry text not color-only; mobile: rows as cards with "Manage" button full width.

## 8. Acceptance criteria

- [ ] Project admin option never offered for guests or invitations.
- [ ] PM sees Add/Invite but not "Make project admin" or "Assign client PO".
- [ ] Removing the last administrator is blocked with the exact message.
- [ ] Revoking the client PO guest clears the client PO card.
- [ ] Pending invitation roles cannot be edited in place.
