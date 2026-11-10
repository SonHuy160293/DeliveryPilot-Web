# Page 09 — Engagement detail

| Item    | Value                                                                                                                                                                                                                                                                                                                                                   |
| ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Status  | **New, mock-backed.** Route **APPROVED 11 Nov 2026** (T0-01).                                                                                                                                                                                                                                                                                           |
| Route   | `ROUTES.workspaceEngagement` → `/w/:workspaceSlug/engagements/:engagementId?tab=<tab>`; tabs: details, contract, milestones, contacts, projects, client-link, history                                                                                                                                                                                   |
| Feature | FEAT-DP-025 · FR-025-002…010                                                                                                                                                                                                                                                                                                                            |
| Backend | Implemented: `GET …/engagements/{id}`, `GET …/{id}/history`, `PUT …/{id}/contract-value`, `POST …/{id}/close`, `POST …/{id}/reopen`, `POST …/{id}/milestones`, `PUT …/milestones/{mid}`, `POST …/milestones/{mid}/change-date`, `POST …/milestones/{mid}/change-status`. **Contract pending (G6):** edit details, contacts, link code, linked projects. |
| Roles   | Full detail: `read-all`, `manage`, creator. Edits: `manage` only.                                                                                                                                                                                                                                                                                       |
| Entry   | Page 08 row; create success; page 12 engagement link (full-detail holders only)                                                                                                                                                                                                                                                                         |
| Exit    | Breadcrumb → page 08; "Projects" tab row → page 12; "Create project" → page 11 dialog with engagement preselected                                                                                                                                                                                                                                       |

## 1. Purpose

Single place to read and maintain everything recorded about one client agreement, with full attribution.

## 2. Wireframe — desktop

```
┌ Sidebar ┬──────────────────────────────────────────────────────────────────────────┐
│         │ Workspaces › Northwind Delivery Studio › Engagements › Larkspur Retail Group │
│         │ Larkspur Retail Group  [Active]                      [Create project] [⋯ Close engagement] │
│         │ Loyalty platform rebuild · LRG-2026-014 · Signed 15 Sep 2026            │
│         │ ┌ Alert (only after create with duplicate) ───────────────────────────┐ │
│         │ Tabs: Details | Contract | Milestones (4) | Contacts (2) | Projects (1) | Client link | History │
│         │ ── Details ───────────────────────────────────────────────── [Edit details] │
│         │  Client display name   Larkspur Retail Group                              │
│         │  Client legal name     Larkspur Retail Group Pty Ltd                      │
│         │  Country               AU                                                 │
│         │  Engagement name       Loyalty platform rebuild                           │
│         │  Agreement reference   LRG-2026-014                                       │
│         │  Signed on             15 Sep 2026                                        │
│         │  Agreement document    Open document ↗ (https link, new tab)             │
│         │  Created               16 Sep 2026, 09:12 by Mai Tran                     │
│         │ ── Milestones tab ─────────────────────────────────────────── [Add milestone] │
│         │  Name            │ Original    │ Current     │ Status   │ Actions          │
│         │  Discovery sign-off│ 10 Oct 2026│ 10 Oct 2026 │ Achieved │ —                │
│         │  Beta release    │ 15 Dec 2026 │ 12 Jan 2027 │ Planned  │ [Change date] [Change status] [Edit] │
└─────────┴──────────────────────────────────────────────────────────────────────────┘
```

Mobile: header actions wrap under the title; tabs become a horizontally scrollable `TabsList` (no page overflow); milestone table → cards.

## 3. Component tree

```
AppLayout
└─ EngagementDetailPage                       src/pages/EngagementDetailPage.tsx
   ├─ PageHeader { title: clientDisplayName, description: "<engagementName> · <reference> · Signed <date>", breadcrumbs, action:<EngagementHeaderActions/> }
   ├─ MockDataBanner, StatusMessage
   └─ ReadState { query: engagementQuery(workspaceId, engagementId), scope:"engagement" }
      ├─ ClosedNotice { closedAt, closedBy }            (status=Closed)
      ├─ DuplicateReferenceNotice                       (navigation state from create)
      └─ Tabs value={tab} (synced to ?tab=)
         ├─ EngagementDetailsTab { engagement, canManage }        features/engagements/details/
         │  └─ EditDetailsDialog (FormDialog)                     [contract pending]
         ├─ ContractValueTab { engagement, canManage }            features/engagements/contract/
         │  └─ ContractValueDialog (FormDialog)
         ├─ MilestonesTab { milestones, canManage, engagementActive }  features/engagements/milestones/
         │  ├─ DataTable
         │  ├─ AddMilestoneDialog, EditMilestoneDialog
         │  ├─ ChangeMilestoneDateDialog (ReasonField required)
         │  └─ ChangeMilestoneStatusDialog (allowed transitions only)
         ├─ ContactsTab { contacts, canManage }                   features/engagements/contacts/ [contract pending]
         ├─ LinkedProjectsTab { engagementId }                    [ERD-DERIVED, G8]
         ├─ ClientLinkTab { engagement, canManage }               features/engagements/link/ [contract pending]
         └─ HistoryTab { engagementId }                           features/engagements/history/
EngagementHeaderActions { engagement, permissions }
   ├─ Button asChild Link "Create project" (Active + caller has projects.create)
   └─ ConfirmAction "Close engagement" reasonMode=required | "Reopen engagement" reasonMode=required
```

## 4. Data

`EngagementDetail` incl. `contacts[]`, `milestones[]`; `EngagementHistoryEntry[]` (paged); `LinkedProjectSummary[]` [ERD-DERIVED]. Sample: `05-mock-data/engagements.json`, `engagement-history.json`.

**Details tab fields**: clientDisplayName, clientLegalName, clientCountryCode, engagementName, agreementReference, agreementSignedOn, documentUrl, createdAt + createdByUserId (name via lookup), updatedAt.

**Contract tab** (full detail only):

```
Contract value     AUD 185,000.00          (or "Not recorded")
Planned effort     420.0 person-days       (or "Not recorded")
Contract model     Fixed price
                                     [Set contract value]
```

**Projects tab**: name (link only if caller participates; otherwise plain text), status badge, administrator names. Copy: "You see project names, status and administrators. Project content needs project access."

**History tab**: table Event | Changed by | When | Reason. Event labels from `eventType` map, e.g. `EngagementCreated` → "Engagement created", `ContractValueChanged` → "Contract value changed", `MilestoneDateChanged` → "Milestone date changed", `EngagementClosed` → "Engagement closed". Unknown types → "Engagement updated". `details` JSON rendered as "Previous → New" pairs for known keys only.

## 5. Actions & forms

All write actions require `organization.engagements.manage` **and** status Active, except Reopen (Closed) and Remove client link (any status).

| Action                       | Form fields                                                                                                                        | Rules                                                                                                                                    | Result copy                   |
| ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------- |
| Edit details [pending]       | same as create + `Reason`                                                                                                          | Reason **required** when agreement reference or signed date changed, else optional                                                       | "Engagement details updated." |
| Set contract value           | Amount (decimal), Currency (3 letters), Planned effort (person-days), Reason (optional)                                            | amount ≥0, ≤2 dp; effort ≥0, ≤1 dp; currency read-only while stored amount non-null; "Clear amount and currency" checkbox sets both null | "Contract value updated."     |
| Add milestone                | Name (1–200), Description (≤2000, optional), Target date (required)                                                                | —                                                                                                                                        | "Milestone added."            |
| Edit milestone               | Name, Description                                                                                                                  | Planned/Missed only                                                                                                                      | "Milestone updated."          |
| Change date                  | New target date, Reason (required)                                                                                                 | Planned/Missed only; shows "Original date 15 Dec 2026 stays recorded."                                                                   | "Milestone date changed."     |
| Change status                | Status radio (allowed transitions only: from Planned → Achieved/Missed/Retired; from Missed → Achieved/Retired), Reason (optional) | Achieved/Retired rows show no actions                                                                                                    | "Milestone marked Achieved."  |
| Close engagement             | Reason (required)                                                                                                                  | consequence: "Edits and new projects will be blocked. Existing projects keep working."                                                   | "Engagement closed."          |
| Reopen engagement            | Reason (required)                                                                                                                  | —                                                                                                                                        | "Engagement reopened."        |
| Add/edit contact [pending]   | Name (1–200), Email, Contact role select: Client Product Owner / Sponsor / Other                                                   | Choosing Client Product Owner when another exists shows "This replaces <name> as client Product Owner."                                  | "Contact saved."              |
| Remove contact [pending]     | ConfirmAction                                                                                                                      | —                                                                                                                                        | "Contact removed."            |
| Issue link code [pending]    | none                                                                                                                               | Only when no confirmed link; issuing again shows consequence "The previous code will stop working."                                      | Code panel (below)            |
| Remove client link [pending] | ConfirmAction reasonMode=optional                                                                                                  | Allowed when Closed                                                                                                                      | "Client link removed."        |

Every mutating request sends `expectedVersion: engagement.version` (or milestone version).

**Link code panel (shown once):**

```
┌ Alert ─────────────────────────────────────────────────────────┐
│ Link code (shown only now)                                      │
│ 7KQ4-MZ2P-H9TD                [Copy code]                       │
│ Send this code to an Owner or Admin of the client's workspace.  │
│ It expires 18 Nov 2026, 10:30 and works once. Linking grants    │
│ no access to anything.                                          │
└─────────────────────────────────────────────────────────────────┘
```

Afterwards the tab shows `StatusBadge attention` "Code outstanding" + "Expires 18 Nov 2026, 10:30". Confirmed link shows "Linked to a client workspace on 20 Sep 2026" (no client workspace name is returned — only the ID; do not display the UUID).

## 6. States

| State                           | Presentation                                                                                                                                              |
| ------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Loading                         | Header skeleton + tab skeleton                                                                                                                            |
| Not found / no full detail      | In-page message "This engagement isn't available. It may not exist, or you may not have access." + "Back to engagements" (BR-UI-13)                       |
| Error                           | `ScreenState error` + Try again                                                                                                                           |
| Empty milestones                | "No milestones yet" / "Add the delivery dates agreed with the client." + Add milestone (manage only)                                                      |
| Empty contacts                  | "No client contacts recorded."                                                                                                                            |
| Empty projects                  | "No projects under this engagement yet." + Create project (if permitted and Active)                                                                       |
| Closed                          | `Alert` "This engagement is closed. Closed engagements are read-only. Reopen it to make changes." All edit buttons hidden; Reopen shown to manage holders |
| Conflict 409                    | Conflict alert in dialog; "Reload" refetches and keeps dialog open with server values                                                                     |
| Success                         | `StatusMessage` text from table above                                                                                                                     |
| Read-only (read-all, no manage) | Edit buttons hidden; small text under header "You can view this engagement. Editing needs engagement management permission."                              |

## 7. Responsive & accessibility

- Tabs: `TabsList` with `aria-label="Engagement sections"`; arrow-key navigation (Radix); URL sync uses `replace` to avoid history spam.
- Money aligned end in tables; `Intl.NumberFormat` currency formatting; amount input `inputMode="decimal"`.
- "Copy code" announces "Code copied" in `role="status"`; code text is selectable.
- External document link: `target="_blank" rel="noreferrer noopener"` and visible "(opens in a new tab)" sr-only text.

## 8. Acceptance criteria

- [ ] Original milestone date never changes after a date change; both dates visible.
- [ ] Achieved → Planned is not offered.
- [ ] Changing currency while an amount exists is impossible in the UI.
- [ ] After close, no edit control is reachable by keyboard.
- [ ] Contract tab and history are never rendered for summary-tier users (they cannot reach this page at all).
- [ ] Link code appears exactly once and is not present in any query cache after the panel is dismissed.
- [ ] All "contract pending" actions are visibly labelled in the mock build only via MockDataBanner; no claim of server save.
