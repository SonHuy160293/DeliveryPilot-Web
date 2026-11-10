# Page 10 — Client links (client workspace side)

| Item    | Value                                                                                                   |
| ------- | ------------------------------------------------------------------------------------------------------- |
| Status  | **New, mock-backed.** Section **APPROVED 11 Nov 2026** (T0-01) [A4]. Backend **contract pending** (G6). |
| Route   | `/w/:workspaceSlug?section=client-links` (new `WORKSPACE_SECTIONS` value)                               |
| Feature | FEAT-DP-025 · FR-025-009 · US-025-007/008                                                               |
| Roles   | Owner or Admin **of this workspace** (the client organization C)                                        |
| Entry   | Sidebar Manage › "Client links"                                                                         |
| Exit    | Stays in section                                                                                        |

## 1. Purpose

Let a client organization's Owner/Admin confirm a vendor's link code and see/remove links. A link records the business relationship; **it grants no access in either direction**.

## 2. Wireframe

```
┌──────────────────────────────────────────────────────────────────┐
│ Client links                                                      │
│ Vendors can link their engagement with your company to this       │
│ workspace. Linking does not give anyone access to anything.       │
│                                                                   │
│ ┌ Card: Confirm a link code ──────────────────────────────────┐   │
│ │ Link code                                                    │   │
│ │ [________________]  [Check code]                             │   │
│ └──────────────────────────────────────────────────────────────┘  │
│                                                                   │
│ Linked engagements                                                │
│ ┌──────────────────────────────────────────────────────────────┐ │
│ │ Engagement               │ Client name used by vendor │      │ │
│ │ Loyalty platform rebuild │ Larkspur Retail Group      │ [Remove link] │
│ └──────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────┘

Preview dialog after "Check code":
┌ Dialog: Confirm client link ─────────────────────────────┐
│ Engagement      Loyalty platform rebuild                  │
│ Client name     Larkspur Retail Group                     │
│ Confirming links this engagement to Larkspur Retail Group │
│ (this workspace). No one gains access.                    │
│                          [Cancel] [Confirm link]          │
└───────────────────────────────────────────────────────────┘
```

## 3. Component tree

```
WorkspacePanels section="client-links"
└─ ClientLinksPanel { workspaceId }                 features/engagements/link/ClientLinksPanel.tsx
   ├─ SectionHeading
   ├─ LinkCodeForm { onPreview(preview) }            Input id="link-code" + Button "Check code"
   ├─ ConfirmLinkDialog { preview, onConfirmed }
   └─ ReadState → DataTable<LinkedEngagement>  + ConfirmAction "Remove link"
```

## 4. Data

```ts
LinkPreview { engagementName: string | null; clientDisplayName: string }
LinkedEngagement { engagementId: string; engagementName: string | null; clientDisplayName: string; linkedAt: string; version: number }
```

## 5. Actions

| Action             | Rules                                                                                                              | Result / error                                                                                                                        |
| ------------------ | ------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------- |
| Check code         | required, trimmed; uppercase on input                                                                              | Invalid/expired/used/closed engagement → one message: "This code can't be used. Ask the vendor for a new code." (generic, FR-025-009) |
| Confirm link       | —                                                                                                                  | "Engagement linked." Row appears                                                                                                      |
| Remove link        | ConfirmAction consequence "The vendor's engagement will no longer be linked to this workspace. No access changes." | "Link removed."                                                                                                                       |
| Rate limited       | 429                                                                                                                | "Too many attempts. Try again in 2 minutes." with countdown (`RetryDelay`)                                                            |
| Own workspace code | server rejects                                                                                                     | "A workspace can't link to its own engagement."                                                                                       |

## 6. States

Loading (list skeleton), Empty "No linked engagements.", Error + retry, No-permission (non Owner/Admin: section hidden from nav; direct URL shows "Only workspace Owners and Admins can manage client links."), Success messages above.

## 7. Accessibility

Code input `autocomplete="off"`, `spellcheck=false`; error with `aria-describedby`.

## 8. Acceptance criteria

- [ ] A plain Member never sees the nav item; direct URL shows the no-permission message.
- [ ] All invalid-code variants show the identical generic message.
- [ ] No copy suggests that linking grants access.
