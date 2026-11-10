# Page 17 — Join project (guest invitation response)

| Item    | Value                                                                                                                                      |
| ------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| Status  | **New, mock-backed.** Route **APPROVED 11 Nov 2026** (T0-01) [A3].                                                                         |
| Route   | `ROUTES.joinProject` → `/join-project#<proof>`                                                                                             |
| Feature | FEAT-DP-004 · FR-004-008, 010 · US-004-007                                                                                                 |
| Pattern | Mirrors page 06: fragment scrubbed at bootstrap into an ephemeral flow object; proof never in Query cache, URL after load, logs or storage |
| Roles   | Invited person with a DeliveryPilot account whose primary email matches                                                                    |
| Entry   | Invitation email                                                                                                                           |
| Exit    | Accept → `/portal/projects/:projectId`; Decline → result panel with "Go to client portal"                                                  |

## 1. Purpose

Let an external person accept or decline a project guest invitation.

## 2. Wireframe

```
┌──────────────── Card max-w-md ───────────────────┐
│ Join a project                                    │
│ Mai Tran invited you to                           │
│ Loyalty platform – Phase 1                        │
│ Your role: BA                                     │
│ Expires 18 Nov 2026                               │
│ You'll join as a guest. You'll see this project   │
│ only, and only what the team shares with you.     │
│ [Accept invitation]  [Decline]                    │
└───────────────────────────────────────────────────┘
```

## 3. Component tree

```
PublicLayout
└─ JoinProjectPage                                  src/pages/JoinProjectPage.tsx
   └─ ProjectInvitationFlowBoundary                  features/projects/guest-invitations/recipient/
      └─ JoinProjectInvitation { flow }
         ├─ signed-out → Button asChild Link "Continue to sign in"
         ├─ PreviewCard { preview }
         └─ ResultPanel { outcome }
```

## 4. Data

```ts
ProjectInvitationPreview { invitationId; projectName; offeredRole: RoleCode; inviterDisplayName: string | null; expiresAt; version }
```

## 5–6. Actions and states

| Situation                                                      | Presentation                                                                                                                                                   |
| -------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Signed out                                                     | "Sign in with the email address this invitation was sent to." + Continue to sign in                                                                            |
| Loading preview                                                | Skeleton + `role="status"` "Checking your invitation"                                                                                                          |
| Valid                                                          | Preview card                                                                                                                                                   |
| Email mismatch                                                 | "This invitation is for a different email address. Sign out and sign in with the invited address." + Sign out                                                  |
| Acceptor is workspace member                                   | "You're a member of this vendor's workspace. Ask a project administrator to add you to the team instead."                                                      |
| Former member with active participation                        | Extra note in preview: "Accepting ends your previous team membership on this project and adds you as a guest." [ASSUMPTION: server can signal this in preview] |
| Expired / used / cancelled / rotated / inviter lost permission | Generic "This invitation can no longer be used. Ask the project team to send a new one."                                                                       |
| Already a guest                                                | "You already have access to this project." + Open project                                                                                                      |
| Accepted                                                       | Navigate to portal project, StatusMessage "You joined Loyalty platform – Phase 1."                                                                             |
| Declined                                                       | "You declined the invitation." + Go to client portal                                                                                                           |
| Network error                                                  | Error + Try again (proof kept in memory only)                                                                                                                  |

## 7. Accessibility

Focus result heading after accept/decline; buttons min-h-11.

## 8. Acceptance criteria

- [ ] Fragment removed from address bar before first render.
- [ ] Proof cleared on account change, completion, unmount (same tests as `recipientIntegration.test.tsx`).
- [ ] No workspace membership is implied anywhere in copy.
