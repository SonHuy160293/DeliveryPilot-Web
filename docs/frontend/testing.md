# Testing and verification

## Philosophy and setup

Use pure unit tests for meaningful pure behavior and component tests for user-visible interaction. This foundation primarily needs route, form, modal, and state coverage, so tests render the real AppRoutes tree through MemoryRouter. Avoid whole-page snapshots and tests that repeat implementation internals.

Vitest uses jsdom and jest-dom, with DOM cleanup, mock restoration, and theme cleanup. `src/test/renderRoute.tsx` is the shared route renderer. Tests never replace authorization with a fixture identity. MSW 3 intercepts API tests; unhandled network frames fail and handlers reset after each test. No live backend is required.

```tsx
const user = userEvent.setup();
renderRoute(ROUTES.signIn);
await user.click(screen.getByRole("button", { name: "Sign in" }));
expect(screen.getByLabelText("Email")).toHaveAccessibleDescription(
  "Enter your email address.",
);
```

Arrange a fresh screen, act using accessible controls, and assert the visible outcome. Prefer role/label queries. Scope modal queries to the dialog when labels could otherwise be ambiguous. Use waitFor for focus lifecycle, not arbitrary sleeps.

## Required coverage

- All approved routes and the unknown-address fallback; anonymous route guards, sign-in and workspace navigation.
- Preview states on unconnected pages and unknown query fallback. Connected sign-in ignores preview state overrides.
- Required and invalid-email errors on blur/submit; first-invalid focus, correction, and stale feedback removal.
- Required-only password; connected registration validates display name/email, confirms real adapter outcomes, prevents duplicate requests, honors Retry-After and cancels on departure. Both auth forms use MSW and keep credentials outside storage, logs and Query caches. Registration grants no session/membership and requires reopening an invitation email after sign-in.
- Connected name-only workspace creation, retained idempotency attempts/replays, fresh UUID membership admission, discovery pagination, and genuine empty/error/success states.
- Radix dialog focus containment, Escape, focus return; mobile Sheet keyboard/navigation behavior.
- Shared headings, breadcrumbs, and useful empty content.
- Theme default, keyboard activation, persistence/remount, and unavailable storage.
- Fictional counts and UTC dates.

Organization contract tests cover all 30 method/path pairs, closed bodies, safe failures, cancellation, and runtime shapes. Additional UI tests cover protected reads/actions separately, full role updates, invitation issuance versus delivery, ownership continuity, rate-limit waiting, typed audit history/revocation, StrictMode sign-in continuation, same-proof acceptance recovery, and secret exclusion from Query/storage. Audit fixtures cover all 16 registered projections. All fictional records stay in `mocks/workspaces.ts`; synthetic handlers/harnesses stay under `test`. The ResizeObserver stub enables Radix semantic tests in jsdom and does not simulate layout or certify responsive behavior.

## API coverage

See [api-integration.md](api-integration.md) for the test-only CRUD harness and contract authority. HTTP tests cover JSON/204, malformed data, safe errors and ProblemDetails, 401/403, timeouts, cancellation, redirects, destination/credential boundaries and bearer integration. Query tests create separate clients and exercise list/detail/mutation, loading/empty/error/manual retry, background refresh, targeted invalidation, filter/account/workspace keys, cancellation during cache cleanup, dependent queries and bounded safe retries. The fixture adapter is test infrastructure and is not a product API.

## Commands

```powershell
npm run test
npm run test:run
npm run typecheck
npm run lint
npm run format:check
npm run build
npm run preview
```

The first test command watches; test:run exits after one suite. For targeted work: `npm run test:run -- src/features/auth/AuthForm.test.tsx`. Run the full quality gate before delivery, then re-run affected checks after fixes. Build also type-checks before bundling.

## Accessibility and browser limits

ESLint checks JSX accessibility patterns. Component tests verify labels/error associations, landmarks, roles/announcements, keyboard behavior, and modal focus. Contrast is measured against frozen theme tokens for text, primary/destructive text, input boundaries, and focus. Decorative separators are not essential control boundaries.

jsdom does not verify CSS layout, zoom, computed Tailwind styles, or real assistive technology. Responsive overflow, visible focus, sticky scrolling, media behavior, and 200% zoom require browser inspection. No axe/Lighthouse or browser automation dependency was installed. Tests alone do not certify WCAG compliance.

See [verification.md](verification.md) for actual results and limitations. This strategy document does not claim checks were executed.

## Common failures

Alias errors mean TypeScript paths and Vite aliases differ. Missing DOM matchers mean setup.ts is not loaded. Missing styles mean main.tsx or the Tailwind Vite plugin is misconfigured. Browser refresh returning 404 means production SPA fallback is missing. npm cache permission errors can use the repository-local cache setting documented in README.
