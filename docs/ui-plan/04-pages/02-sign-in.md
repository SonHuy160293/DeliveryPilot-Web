# Page 02 — Sign in

| Item   | Value                                                                                                    |
| ------ | -------------------------------------------------------------------------------------------------------- |
| Status | **Existing, connected** to `POST /identity/api/v1/auth/login` (D1). No mock.                             |
| Route  | `ROUTES.signIn` → `/sign-in`                                                                             |
| Layout | `PublicLayout`, auth card `max-w-md`                                                                     |
| Files  | `src/pages/AuthPage.tsx`, `src/features/auth/components/SignInForm.tsx`, `features/auth/api/loginApi.ts` |
| Roles  | Anonymous                                                                                                |
| Entry  | Header "Sign in", sign-up success, auth guard redirect, `/join-workspace` / `/join-project` continuation |
| Exit   | Success → `/workspaces` (or back to the pending invitation flow); "Create an account" → `/sign-up`       |

## 1. Purpose

Authenticate a returning user. Authentication grants no workspace or project access (FEAT-DP-002).

## 2. Wireframe

```
┌──────────── max-w-md card ────────────┐
│ Sign in                                │
│ Use the email and password you         │
│ registered with.                       │
│                                        │
│ Email                                  │
│ [______________________________]       │
│ Password                               │
│ [______________________________]       │
│ ⚠ error text (if any)                  │
│                                        │
│ [        Sign in         ] (primary)   │
│ No account? Create an account          │
└────────────────────────────────────────┘
```

## 3. Component tree

```
PublicLayout
└─ AuthPage variant="signIn" (key distinct per variant)
   └─ Card
      └─ SignInForm   { onSuccess(): void }
         ├─ FormField id="sign-in-email" label="Email"   → Input type=email autoComplete=email
         ├─ FormField id="sign-in-password" label="Password" → Input type=password autoComplete=current-password
         ├─ Alert destructive (role=alert) for request errors
         └─ Button type=submit "Sign in"
```

## 4. Data

Request `{ email: string; password: string }`. Response: access token kept **in memory only** (`authSession.ts`), refresh cookie set by the server. Never persisted to storage.

## 5. Actions & validation

| Field    | Rules (UI-FRM-06)      | Error                                                        |
| -------- | ---------------------- | ------------------------------------------------------------ |
| Email    | required, email format | "Enter your email address." / "Enter a valid email address." |
| Password | required only          | "Enter your password."                                       |

Submit → pending state disables button ("Signing in…"). 401/invalid → "The email or password is incorrect." (non-specific), password cleared, focus to password.

## 6. States

| State                 | Presentation                                                                                                         |
| --------------------- | -------------------------------------------------------------------------------------------------------------------- |
| Ready                 | Empty form                                                                                                           |
| Loading               | Submit pending                                                                                                       |
| Error                 | `Alert destructive` with safe message; network: "We couldn't reach the server. Check your connection and try again." |
| Success               | Navigate away; no success screen                                                                                     |
| Empty / no-permission | N/A                                                                                                                  |

## 7. Responsive & accessibility

Labels above inputs; errors linked by `aria-describedby`; `autocomplete` attributes; Enter submits.

## 8. Acceptance criteria

- [ ] Credentials never appear in URL, storage or Query cache.
- [ ] After sign-in from `/join-workspace` or `/join-project`, the pending invitation flow resumes.
