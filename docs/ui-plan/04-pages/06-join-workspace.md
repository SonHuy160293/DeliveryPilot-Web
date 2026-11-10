# Page 06 — Join workspace

| Item   | Value                                                                                              |
| ------ | -------------------------------------------------------------------------------------------------- |
| Status | **Existing, connected** (D1): `POST /organization-invitations/{id}/preview`, `/accept`, `/decline` |
| Route  | `ROUTES.joinWorkspace` → `/join-workspace` (proof in URL fragment, scrubbed at bootstrap)          |
| Files  | `src/pages/JoinWorkspacePage.tsx`, `features/workspaces/recipient/*`                               |
| Roles  | Invited recipient (signed-in account with matching primary email)                                  |
| Entry  | Invitation email link                                                                              |
| Exit   | Accept → `/w/:id`; Decline → confirmation with "Go to workspaces"; sign-in continuation            |

## 1. Purpose

Let the recipient preview and accept or decline a workspace invitation (INV-01…06).

## 2. Wireframe

```
┌──────────── Card ─────────────────────────────┐
│ Join a workspace                               │
│ Northwind Delivery Studio invited you as:      │
│ [Member] [Delivery lead]                       │
│ Expires 18 Nov 2026                            │
│ [Accept invitation]   [Decline invitation]     │
└────────────────────────────────────────────────┘
```

## 3–8.

Component tree, states and acceptance are implemented and tested (`recipientIntegration.test.tsx`). States: signed-out → "Continue to sign in"; proof missing/invalid → generic "This invitation link is not valid"; `requiresReissue` → "Ask the sender for a new invitation"; mismatched email → guidance to switch account; accepted/declined → result panel. **Page 17 (Join project) mirrors this page.**
