# Page 03 — Sign up

| Item   | Value                                                                                                                       |
| ------ | --------------------------------------------------------------------------------------------------------------------------- |
| Status | **Existing, connected** to `POST /identity/api/v1/auth/register` (D1).                                                      |
| Route  | `ROUTES.signUp` → `/sign-up`                                                                                                |
| Files  | `src/pages/AuthPage.tsx`, `src/features/auth/AuthForm.tsx`, `features/auth/model/registrationForm.ts`, `useRegistration.ts` |
| Roles  | Anonymous                                                                                                                   |
| Entry  | Home "Create account", sign-in link                                                                                         |
| Exit   | Success panel → "Continue to sign in" (`/sign-in`)                                                                          |

## 1. Purpose

Create a platform identity (FR-DP-002-001…003). Registration does **not** sign the user in and does not verify email.

## 2. Wireframe

```
┌──────────── max-w-md card ────────────┐
│ Create your account                    │
│ Display name                           │
│ [______________________________]       │
│ Email                                  │
│ [______________________________]       │
│ Password                               │
│ [______________________________]       │
│ [     Create account      ]            │
│ Already have an account? Sign in       │
└────────────────────────────────────────┘

Success:
┌────────────────────────────────────────┐
│ ✓ Account created                      │
│ Sign in with your new email and        │
│ password.  [Continue to sign in]       │
└────────────────────────────────────────┘
```

## 3. Component tree

```
AuthPage variant="signUp"
└─ AuthForm
   ├─ FormField "Display name" → Input autoComplete=name
   ├─ FormField "Email"        → Input type=email
   ├─ FormField "Password"     → Input type=password autoComplete=new-password
   └─ Button "Create account"
```

## 4. Data

Request `{ displayName, email, password }` → `201 { userId }`. No session is created; credentials are not cached.

## 5. Validation

| Field        | Rule                          | Server error mapping                                                  |
| ------------ | ----------------------------- | --------------------------------------------------------------------- |
| Display name | required, trimmed             | field error                                                           |
| Email        | required, email format        | duplicate → **"This email is exist"** (exact text, D-002) under Email |
| Password     | required (no policy approved) | field error from server                                               |

## 6. States

Ready, Loading (submit pending), Error (alert), Success (panel above). Empty/no-permission N/A.

## 7. Accessibility

Success panel receives focus (`tabIndex=-1`) and is announced with `role="status"`.

## 8. Acceptance criteria

- [ ] A duplicate email shows exactly "This email is exist".
- [ ] After success the user is still signed out.
