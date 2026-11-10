# Page 08 — Engagements (list + create)

| Item    | Value                                                                                                                                      |
| ------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| Status  | **New, mock-backed.** Route **APPROVED 11 Nov 2026** (T0-01).                                                                              |
| Route   | `ROUTES.workspaceEngagements` → `/w/:workspaceSlug/engagements?status=<status>&q=<text>`; status: Active, Closed, all                      |
| Feature | FEAT-DP-025 · FR-025-001, FR-025-006 · US-025-001                                                                                          |
| Backend | Implemented: `GET /api/v1/organizations/{organizationId}/engagements?status&limit&cursor`, `POST …/engagements` (no Gateway route yet, G5) |
| Roles   | Holders of `organization.engagements.create`, `read-all` or `manage`; engagement creators (see 01 §6.1)                                    |
| Entry   | Sidebar "Engagements"; workspace overview "View engagements"; breadcrumb from page 09                                                      |
| Exit    | Row → page 09; "Create engagement" success → page 09 of the new engagement                                                                 |

## 1. Purpose

Let delivery leaders find client agreements of the workspace and let authorized members record a new one.

## 2. Wireframe — desktop (≥1024px)

```
┌ Sidebar ┬───────────────────────────────────────────────────────────────────────┐
│         │ Workspaces › Northwind Delivery Studio › Engagements                  │
│         │ Engagements                                      [Create engagement]  │
│         │ Client agreements this workspace delivers against.                    │
│         │ ┌ MockDataBanner: Sample data. Not connected to the server yet… ┐     │
│         │ FilterBar: Search [Client or reference…]  Status [Active ▾]  3 engagements │
│         │ ┌───────────────────────────────────────────────────────────────────┐ │
│         │ │ Client               │ Engagement            │ Reference   │ Signed     │ Milestones │ Status │
│         │ │ Larkspur Retail Group│ Loyalty platform rebuild│ LRG-2026-014│ 15 Sep 2026│ 1 of 4 achieved │ Active │
│         │ │ Halden Logistics     │ Fleet telemetry MVP   │ HL-SOW-07   │ 2 Oct 2026 │ 0 of 2 achieved │ Active │
│         │ └───────────────────────────────────────────────────────────────────┘ │
│         │                          [Load more]                                  │
└─────────┴───────────────────────────────────────────────────────────────────────┘
```

## 2b. Wireframe — mobile (<768px)

```
┌──────────────────────────────┐
│ ☰  Engagements               │
│ [Create engagement]          │
│ Search [____________]        │
│ Status [Active ▾]            │
│ ┌ Card ────────────────────┐ │
│ │ Larkspur Retail Group    │ │
│ │ Loyalty platform rebuild │ │
│ │ Reference  LRG-2026-014  │ │
│ │ Signed     15 Sep 2026   │ │
│ │ Milestones 1 of 4 achieved│ │
│ │ [Active]                 │ │
│ └──────────────────────────┘ │
└──────────────────────────────┘
```

## 3. Component tree

```
AppLayout
└─ EngagementsPage                                   src/pages/EngagementsPage.tsx (≤180 lines)
   ├─ PageHeader { title:"Engagements", description, breadcrumbs, action:<CreateEngagementDialog/> }
   ├─ MockDataBanner (when repository.kind === "mock")
   ├─ StatusMessage { message, onDismiss }
   ├─ FilterBar { search:{id:"engagement-search"}, filters:[{id:"engagement-status", options: Active|Closed|All}], resultCount }
   └─ ReadState { query: engagementListQuery(workspaceId, status), scope:"engagements" }
      └─ EngagementTable { rows: EngagementDetail[], hasMore, onLoadMore }   features/engagements/components/EngagementTable.tsx
         └─ DataTable  columns: client(rowHeader → Link page 09), engagementName, agreementReference, agreementSignedOn, milestones, status(StatusBadge)
CreateEngagementDialog { workspaceId, onCreated(engagement, duplicateWarning) }  features/engagements/components/CreateEngagementDialog.tsx
   └─ FormDialog  fields below
```

## 4. Data

Type `EngagementDetail` (`05-mock-data/types.ts`). List response `Page<EngagementDetail>`. Displayed fields:

| Column     | Field                                           | Format                                        |
| ---------- | ----------------------------------------------- | --------------------------------------------- |
| Client     | `clientDisplayName`                             | link text                                     |
| Engagement | `engagementName`                                | "Not named" (muted) when null                 |
| Reference  | `agreementReference`                            | monospace not allowed → plain `text-sm`       |
| Signed     | `agreementSignedOn` (date)                      | `2 Nov 2026`                                  |
| Milestones | `milestones[]` (included in `EngagementDetail`) | "1 of 4 achieved"; "No milestones" when empty |
| Status     | `status`                                        | `StatusBadge` Active/Closed                   |

Sample: `05-mock-data/engagements.json` (3 records: two Active, one Closed).

## 5. Actions & form

| Control           | Visible when                      | Result                                                                                          |
| ----------------- | --------------------------------- | ----------------------------------------------------------------------------------------------- |
| Create engagement | caller holds `engagements.create` | Opens dialog                                                                                    |
| Status filter     | always                            | Refetch with `status` (`all` → no param); updates URL `?status=`                                |
| Search            | always                            | Client-side filter on `clientDisplayName`, `engagementName`, `agreementReference` (loaded rows) |
| Row link          | always                            | → page 09                                                                                       |
| Load more         | `nextCursor !== null`             | Fetch next page, append                                                                         |

**Create engagement form**

| Field (id)                | Label                              | Type                    | Required | Rules                      | Error copy                                                          |
| ------------------------- | ---------------------------------- | ----------------------- | -------- | -------------------------- | ------------------------------------------------------------------- |
| `eng-client-display-name` | Client display name                | text                    | yes      | trim 1–200                 | "Enter the client's display name." / "Use 200 characters or fewer." |
| `eng-agreement-reference` | Agreement reference                | text                    | yes      | trim 1–100                 | "Enter the agreement reference." / "Use 100 characters or fewer."   |
| `eng-agreement-signed-on` | Agreement signed on                | date                    | yes      | valid date                 | "Enter the date the agreement was signed."                          |
| `eng-name`                | Engagement name (optional)         | text                    | no       | ≤200                       | "Use 200 characters or fewer."                                      |
| `eng-client-legal-name`   | Client legal name (optional)       | text                    | no       | ≤200                       | same                                                                |
| `eng-client-country`      | Client country (optional)          | text, 2 chars uppercase | no       | `^[A-Z]{2}$`               | "Enter a 2-letter country code, for example VN."                    |
| `eng-document-url`        | Agreement document link (optional) | url                     | no       | absolute `https://`, ≤2000 | "Enter a link that starts with https://."                           |

Help text under the dialog title: "Contract model: fixed price. You can add contract value and milestones after creating the engagement."

Submit "Create engagement" → success: close dialog, navigate to page 09, `StatusMessage` "Engagement created." The create response is `{ snapshot: EngagementCreationSnapshot, isReplay }`; when `snapshot.duplicateAgreementReference` is true: page 09 shows `Alert` "Another active engagement in this workspace uses agreement reference LRG-2026-014. Check that this is not a duplicate." Retrying the same submission must reuse the same idempotency attempt (pattern of `useWorkspaceCreation`).

## 6. States

| State                                        | Trigger                     | Presentation                                                                                                                                       |
| -------------------------------------------- | --------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| Loading                                      | first read                  | 5 skeleton rows, `role="status"` "Loading engagements"                                                                                             |
| Empty (no tier or none)                      | 0 items, status=Active      | `EmptyState` "No engagements yet" / "Record a client agreement to create client projects under it." + Create button (only if `engagements.create`) |
| Empty (filter)                               | 0 items after filter/search | "No engagements match these filters." + "Clear filters"                                                                                            |
| Error                                        | network / 5xx               | `ScreenState error` + "Try again"                                                                                                                  |
| No-permission                                | workspace admission denied  | existing admission denied state                                                                                                                    |
| Success                                      | create done                 | `StatusMessage` on page 09                                                                                                                         |
| Edge: Identity unavailable (503 fail-closed) | read                        | Error state copy: "We couldn't confirm your access right now. Try again in a moment."                                                              |

## 7. Responsive & accessibility

- Table `<caption class="sr-only">Engagements</caption>`; client cell is `<th scope="row">`.
- Filter changes announce "3 engagements" in `role="status"`.
- Dialog traps focus; initial focus on first field; Esc closes (confirm discard if dirty).
- 320px: cards; dialog full-width with `max-h` scroll in body.

## 8. Acceptance criteria

- [ ] A user without any engagement code does not see the sidebar item, and direct navigation shows the empty list (not an error).
- [ ] Create button hidden without `engagements.create`; a 403 on submit shows "You no longer have permission to create engagements."
- [ ] Created engagement appears at page 09 with status Active and creator attribution.
- [ ] Duplicate reference warning is shown and creation still succeeds.
- [ ] `https://` validation rejects `http://example.com`; 201-character client name is rejected.
- [ ] MockDataBanner present while mock repository is active; no copy claims data was saved to a server.
