# Page 18 — Client sharing (vendor side)

| Item    | Value                                                                                                                     |
| ------- | ------------------------------------------------------------------------------------------------------------------------- |
| Status  | **New, mock-backed.** Route **APPROVED 11 Nov 2026** (`?tab=sharing`).                                                    |
| Route   | `/w/:workspaceSlug/projects/:projectId?tab=sharing`                                                                       |
| Feature | FEAT-DP-015 · FR-015-003, 004, 006, 008 · US-015-003…006                                                                  |
| Roles   | Tab visible to PA and member PM. Engagement-summary share additionally needs full engagement detail. Guests never see it. |
| Entry   | Project tabs; "Shared" badges on pages 12/14 link here                                                                    |
| Exit    | "Preview as client" (in-page)                                                                                             |

## 1. Purpose

Decide, item by item, what the project's guests can read beyond the default view; see what is shared now and the history of shares.

## 2. Wireframe

```
Client sharing                                        [Preview as client]
Guests always see: project name, purpose, status, Sprint length, Product Goal,
their own roles, the client Product Owner and the team. Everything below is
internal until you share it. Sharing applies to every current and future guest.

Brief items
┌──────────────────────────────────────────────────────────────────────────┐
│ Problem                          │ [Shared] since 4 Nov 2026 by Linh Pham │ [Withdraw] │
│ Objectives and success criteria  │ [Internal]                            │ [Share]    │
│ Scope and exclusions             │ [Shared] since 4 Nov 2026 by Linh Pham │ [Withdraw] │
│ Assumptions                      │ [Internal]  (empty — guests see "Not yet written") │ [Share] │
│ Constraints and dependencies     │ [Internal]                            │ [Share]    │
│ Open questions                   │ [Internal]                            │ [Share]    │
└──────────────────────────────────────────────────────────────────────────┘
Stakeholder entries (email and team link are never shown to guests)
│ Tomasz Nowak (Client)            │ [Shared] …                           │ [Withdraw] │
│ Priya Raman (Client)             │ [Internal]                           │ [Share]    │
Engagement summary (client name, engagement name, reference, milestones — never money, effort or contacts)
│ Larkspur Retail Group — Loyalty platform rebuild │ [Internal]       │ [Share]    │
History ▸ (table: When | Who | Item | Action | Reason)
```

Internal project / no engagement: Engagement summary section shows "This project has no engagement, so there is nothing to share here." Caller without full engagement detail: button replaced by text "Sharing the engagement summary needs engagement read access."

## 3. Component tree

```
ProjectSharingTab { projectId, permissions }          features/sharing/ProjectSharingTab.tsx
├─ SectionHeading + PreviewToggle (Button outline aria-pressed)
├─ DefaultViewNote
├─ ShareGroup title="Brief items"        → ShareRow[] { item, share, onShare, onWithdraw }
├─ ShareGroup title="Stakeholder entries"→ ShareRow[]
├─ ShareGroup title="Engagement summary" → ShareRow | NotApplicableNote
├─ WithdrawDialog (ConfirmAction reasonMode=optional)
├─ SharingHistory → DataTable<ShareEvent> + LoadMore
└─ GuestPreview (when toggled)  renders PortalProjectView from page 19 with current data, inside Alert banner
```

## 4. Data

`GuestShare`, `ShareableItem`, `ShareEvent` (types), samples `shares.json`.

## 5. Actions

| Action              | Rules                                                                                                                             | Result                                                                            |
| ------------------- | --------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| Share               | No confirmation (reversible); single click; button pending state                                                                  | Badge → Shared; StatusMessage "Problem is now shared with this project's guests." |
| Withdraw            | ConfirmAction, reason optional, consequence "Guests lose access on their next visit. This can't undo anything they already read." | Badge → Internal; "Problem is no longer shared."                                  |
| Preview as client   | Toggle                                                                                                                            | Banner "Preview — this is what guests of this project see." Preview is read-only  |
| Retired stakeholder | Not listed                                                                                                                        | —                                                                                 |

## 6. States

Loading groups; Error; Conflict (concurrent share/withdraw → refetch and show final state, message "Sharing changed while you were working. Showing the latest state."); No-permission: tab not rendered for others; direct `?tab=sharing` falls back to overview.

## 7. Accessibility

Each row: item name as `th scope=row`; status as text badge; button `aria-label="Share Assumptions with guests"`.

## 8. Acceptance criteria

- [ ] Product Goal is not a row (always visible).
- [ ] Engagement summary share disabled for internal projects and for callers without full engagement detail.
- [ ] History shows actor, time and reason for each share/withdraw.
- [ ] Preview never shows emails, contract values or unshared items.
