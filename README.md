# DeliveryPilot frontend foundation

DeliveryPilot connects software delivery commitments to requirements, implementation, verification, acceptance, and release evidence. This repository implements marketing, Identity registration/sign-in, workspace management and proof-protected invitation acceptance. Product capabilities beyond these connected screens remain planned.

Axios and TanStack Query provide the API foundation, including source-verified runtime contracts and connected workspace flows. Sign-in uses an in-memory session. Workspace membership is checked through Identity. Session restoration and server-side logout remain unavailable until their public backend endpoints exist. A route slug does not grant access; authorization is enforced by the backend. Marketing copy marked `TODO(copy)` awaits approval.

## Run on Windows PowerShell

Use Node.js 24 LTS (validated with 24.15.0) and npm (validated with 12.2.1). Node 22.12+ is also supported by the selected tools. Run from this repository, not a nested directory:

```powershell
npm ci
npm run dev
```

Open `http://127.0.0.1:5173`. Vite reserves this port and fails if it is occupied. The public pages run without a backend. Real sign-in requires a running gateway, a valid test account, and the configuration in `.env.example`; see [authentication](docs/frontend/authentication.md). `.env.example` documents optional API and development-proxy configuration; all `VITE_` values are public browser code and must never contain secrets.

If the machine's npm cache is not writable, set a session-only cache location before installing:

```powershell
$env:npm_config_cache = Join-Path $PWD '.cache/npm'
npm ci
```

## Stack and commands

React 19, strict TypeScript 5, Vite 8, Axios 1, TanStack Query 5, React Router 7 in declarative mode, Tailwind CSS 4, and shadcn/ui new-york with Radix primitives. Tests use Vitest, jsdom, React Testing Library, user-event, jest-dom, and MSW 3. ESLint provides typed, hooks, and JSX accessibility rules; Prettier formats maintained source and documentation.

```powershell
npm run typecheck
npm run lint
npm run format:check
npm run test:run
npm run build
npm run preview
```

`npm run test` watches tests. `npm run format` formats files. Build produces ignored static assets in `dist/`. Preview serves that build locally. Production hosting must rewrite unknown document requests to `index.html` so direct navigation and browser refresh work with BrowserRouter; serve asset requests normally. No production deployment is configured.

## Routes and preview states

| Path                | Purpose                                    |
| ------------------- | ------------------------------------------ |
| `/`                 | Product direction and foundation notice    |
| `/sign-in`          | Identity sign-in                           |
| `/sign-up`          | Identity account creation                  |
| `/workspaces`       | Current workspace discovery and creation   |
| `/w/:workspaceSlug` | Authorized workspace management            |
| `/join-workspace`   | Invitation preview, acceptance and decline |
| `*`                 | Page-not-found fallback                    |

Append `?state=ready`, `loading`, `empty`, `error`, `success`, or `no-permission` to preview a presentation. Unknown state values use ready. These parameters **never represent authentication, permission, or server results**. A success preview only confirms its presentation rendered. Connected sign-in, registration and workspace screens ignore demo state overrides. Registration and sign-in send credentials to the configured Identity gateway without retaining them in Query caches. Values clear when the form is unmounted or the dialog closes. Only `deliverypilot-theme` may persist.

Fixtures remain in `src/mocks/workspaces.ts`. Counts use `Intl.NumberFormat("en-US")`; dates use UTC with day–short month–year formatting.

## Repository map

```text
src/
  app/             Router composition and route tests
  layouts/         Public and workspace shells
  pages/           Route coordination and template
  features/        Auth form, marketing sections, workspace dialog
  components/      Shared compositions and generated ui/ primitives
  lib/             Routes, API transport, query policy and scope helpers
  mocks/           Fictional workspace fixtures
  test/            DOM/MSW setup, route helper and test-only API fixture
docs/
  product.md       Unmodified copy of supplied product authority
  ui/              Unmodified constraint-pack documentation
  frontend/        Architecture, development, testing, bootstrap record
```

Read [authentication](docs/frontend/authentication.md), the [API learning guide](docs/frontend/api-integration.md), [architecture](docs/frontend/architecture.md), [development](docs/frontend/development.md), [testing](docs/frontend/testing.md), and [bootstrap decisions](docs/frontend/bootstrap.md). [AGENTS.md](AGENTS.md) is the entry point for future coding agents. The [UI rulebook](docs/ui/UI-RULES.md) and [agent brief](docs/ui/AGENT-BRIEF.md) govern extension.

## Extend the foundation

Start from `BlankPage.tsx` only for an approved feature. Confirm route, resource visibility, data contract, and acceptance criteria first. Pages coordinate; feature components own behavior; shared compositions reuse generated primitives. Keep local state local and use `@/` imports. Add behavioral tests, then run every quality command above. See the development guide for examples and escalation requirements.

The initial bootstrap is complete; future agents must not change dependencies, routes, generated primitives, `components.json`, or theme tokens without explicit authorization. Requested project-specific skills were absent at bootstrap; later tasks must inspect the currently available skill directory. Browser verification and dependency limitations are recorded in the testing and bootstrap guides.

## Local invitation smoke test

In the backend repository set `DELIVERYPILOT_FRONTEND_ORIGIN=http://127.0.0.1:5173` and keep `DELIVERYPILOT_EMAIL_MODE=Mailpit` in `deploy/env/local.env`. Restart the backend stack so Notification, Gateway and Identity receive the same origin. Run this frontend with `npm run dev`; the `/identity` proxy forwards to Gateway on port 19090 without stripping the prefix.

Use disposable accounts and a test workspace. Issue an invitation from the workspace screen and open the new message at `http://localhost:28025`. Older messages can still contain the previous origin. Follow the link, sign in with the invited email, preview, then deliberately accept or decline. Acceptance must enter only after current membership is confirmed. If the recipient has no account, register first, sign in, then reopen the original invitation email. The proof is memory-only and is intentionally lost on reload, registration or account change.

Check wrong-account, expired/superseded links, decline and same-tab sign-in recovery. Mailpit captures email locally; it does not deliver to real inboxes. Resend requires separately provisioned credentials, verified sender/domain and an HTTPS frontend origin; do not put secrets in VITE_ variables. Use trusted local HTTPS if needed for browser Secure-cookie handling rather than weakening cookie attributes.

## Next slice

Implement the missing public refresh/logout contracts before enabling session restoration. Workspace discovery and current membership contracts are already connected. Authorization must be enforced on the server for every resource. Remove demo state overrides from connected screens. Retain separate work, QA, acceptance, and release semantics as later capabilities are introduced; this foundation does not implement them.
