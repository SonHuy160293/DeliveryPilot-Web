# Page 19 — Client portal (19a home, 19b project)

| Item    | Value                                                                                                              |
| ------- | ------------------------------------------------------------------------------------------------------------------ |
| Status  | **New, mock-backed.** Routes **APPROVED 11 Nov 2026** (T0-01); the portal is part of this SPA (OQ-UI-02 answered). |
| Routes  | 19a `ROUTES.portal` → `/portal`; 19b `ROUTES.portalProject` → `/portal/projects/:projectId`                        |
| Layout  | `PortalLayout` [ASSUMPTION]: AppLayout shell, no workspace switcher, sidebar item "My projects" only               |
| Feature | FEAT-DP-015 · FR-015-001, 002, 005, 006, 007 · FEAT-DP-004 FR-004-010 (leave)                                      |
| Roles   | Any signed-in user; content only for active guest participations                                                   |
| Entry   | Account menu "Client portal"; page 17 accept                                                                       |
| Exit    | Project card → 19b; "Leave project" → 19a                                                                          |

## 1. Purpose

Give client guests one place to see projects they were admitted to and the information the vendor shared — and nothing else (FR-015-007).

## 2a. Wireframe — 19a portal home

```
┌ PortalLayout ──────────────────────────────────────────────────────────┐
│ DeliveryPilot · Client portal                     [Theme] [Account ▾] │
│ My projects                                                            │
│ Projects you were invited to as a client guest.                        │
│ ┌ Card ──────────────────────────┐ ┌ Card ──────────────────────────┐ │
│ │ Loyalty platform – Phase 1      │ │ Fleet telemetry MVP            │ │
│ │ [Active]                        │ │ [Draft]                        │ │
│ │ Your role  Viewer               │ │ Your role  BA                  │ │
│ │ [Client Product Owner]          │ │ Admitted 6 Nov 2026            │ │
│ │ Admitted 2 Oct 2026             │ │ [Open project]                 │ │
│ │ [Open project]                  │ └────────────────────────────────┘ │
│ └─────────────────────────────────┘                                    │
└────────────────────────────────────────────────────────────────────────┘
```

No vendor workspace name anywhere (FR-015-001).

## 2b. Wireframe — 19b portal project

```
Client portal › Loyalty platform – Phase 1
Loyalty platform – Phase 1   [Active]
Replace the legacy points engine and launch the new member app…
┌ Facts ──────────────────────────────────────────────────────────────┐
│ Sprint length 2 weeks · Your roles Viewer · Client PO Tomasz Nowak  │
└─────────────────────────────────────────────────────────────────────┘
┌ Product Goal ───────────────────────────────────────────────────────┐
│ Members can earn and redeem points in-store and in the app by …     │
└─────────────────────────────────────────────────────────────────────┘
Team
│ Mai Tran — Project admin, PM │ Sofia Reyes — BA │ Tomasz Nowak — Viewer · Guest · Client PO │
Shared with you
┌ Problem · Shared on 4 Nov 2026 ─────────────────────────────────────┐
│ Store staff cannot see a member's balance at checkout …             │
└─────────────────────────────────────────────────────────────────────┘
┌ Stakeholder: Tomasz Nowak (Client, Larkspur Retail Group) ──────────┐
│ Responsibilities …  Decision areas …                                │
└─────────────────────────────────────────────────────────────────────┘
┌ Engagement summary · Shared on 5 Nov 2026 ──────────────────────────┐
│ Larkspur Retail Group · Loyalty platform rebuild · LRG-2026-014 [Active] │
│ Milestone          │ Original    │ Current     │ Status   │          │
│ Discovery sign-off │ 10 Oct 2026 │ 10 Oct 2026 │ Achieved │          │
└─────────────────────────────────────────────────────────────────────┘
                                                     [Leave project]
```

Guest PM/BA: brief items they may edit by role appear in an extra section "Brief" with Edit buttons (same dialog as page 12). Guest PM also sees "Stakeholders" with edit (FR-015-002 + FR-004-005).

## 3. Component tree

```
PortalLayout
├─ PortalHomePage                                   src/pages/PortalHomePage.tsx
│  ├─ PageHeader "My projects"
│  ├─ MockDataBanner
│  └─ ReadState { query: guestProjectsQuery() } → GuestProjectCard[]   features/portal/components/
└─ PortalProjectPage                                src/pages/PortalProjectPage.tsx
   └─ ReadState { query: guestProjectViewQuery(projectId) }
      └─ PortalProjectView { view, canEditBrief, canEditStakeholders }   (reused by page 18 preview)
         ├─ ProjectFacts, ProductGoalCard (read-only)
         ├─ TeamList { members }  (names + roles, Guest / Client PO markers, no emails)
         ├─ SharedItems { briefItems, stakeholders, engagementSummary }
         ├─ GuestRoleBriefSection (guest PM/BA only)
         └─ LeaveProjectButton
```

## 4. Data

`GuestProjectListItem`, `GuestProjectView` (`types.ts`), samples `portal.json`.

## 5. Actions

| Action                        | Result                                                                                                           |
| ----------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| Open project                  | → 19b                                                                                                            |
| Edit brief item (guest PM/BA) | same dialog/rules as page 12                                                                                     |
| Leave project                 | ConfirmAction "You will lose access to this project immediately." → 19a + "You left Loyalty platform – Phase 1." |

## 6. States

| State                                       | 19a                                                                                                            | 19b                                                                               |
| ------------------------------------------- | -------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| Loading                                     | 3 skeleton cards                                                                                               | header + section skeletons                                                        |
| Empty                                       | "You haven't been invited to any client projects" / "When a vendor invites you to a project, it appears here." | Shared section: "Nothing has been shared with you yet."                           |
| Error                                       | retry                                                                                                          | retry                                                                             |
| Not found / revoked                         | —                                                                                                              | "This project isn't available. Your access may have ended." + Back to my projects |
| Name lookup down                            | —                                                                                                              | Team shows "Name unavailable" + roles                                             |
| Vendor member who is also a guest elsewhere | Only guest projects listed                                                                                     | —                                                                                 |

## 7. Responsive & accessibility

Cards 1/2/3 columns; team as `<ul>`; shared item cards `<article>` with `h3`; dates as `<time dateTime>`.

## 8. Acceptance criteria

- [ ] No vendor workspace name, no emails, no contract value/effort/contacts, no milestone change reasons, no activation waiver reason, no pending invitations, no "no administrator" flag appear.
- [ ] A direct URL for a project without guest participation is indistinguishable from an unknown ID.
- [ ] After withdrawal (page 18), the item disappears on next load.
- [ ] Empty portal is not an error.
