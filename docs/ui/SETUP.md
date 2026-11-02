# DeliveryPilot UI skeleton — setup and verification

This is a **source-only pack** intended for an EXISTING React + TypeScript + Vite repository. It is not an npm project or a runnable zip by itself; the user's `package.json` and lockfile were not supplied. It deliberately does not install or edit dependencies.

## Required baseline (verify first)

- React and React DOM, TypeScript strict mode, Vite.
- Tailwind CSS v4 and the Vite Tailwind integration.
- `react-router` v7; shadcn/ui configured for the Radix-based `new-york` components.
- `@/*` resolving to `./src/*` in both tsconfig and Vite configuration.
- `components.json` with CSS variables enabled and CSS pointing to `src/index.css`.
- Vite `index.html` with `<div id="root"></div>`.

If the repository does not meet these assumptions, STOP. Do not install, upgrade or migrate anything without an approved dependency/configuration task.

## Required shadcn components (proposal, not an installation performed)

```bash
npx shadcn@latest add button card input label alert skeleton dialog sheet breadcrumb badge separator
```

**Important:** The CLI can update dependency manifests, a lockfile, `components.json`, CSS and generated primitive files. Run it *only after checking existing packages and approving the generated diff*. Where these primitives already exist, do not re-add or overwrite them. Select **Radix** for primitives if the CLI asks, and retain the currently approved style. No other UI libraries are allowed.

## Paste order

1. Verify baseline dependencies and generated primitive availability.
2. Bootstrap/configure shadcn only if approved; keep a backup of existing CSS and `components.json`.
3. Add `docs/ui/*`, route constants, shared components, mocks, page-specific pieces, layouts and pages.
4. Replace `src/index.css` with this pack's **one-time approved theme baseline**; do not change it for later features.
5. Replace `src/main.tsx` and add `src/app/router.tsx`. Confirm `index.html` has the root element.
6. Review `product.md`, route map and component variants before exposing preview URLs.

## Preview route matrix

- `/` — marketing
- `/sign-in` — sign-in UI (mock only)
- `/sign-up` — registration UI (mock only)
- `/workspaces` — fictional demo workspaces
- `/w/example-workspace` — blank feature template; does not confer any access
- `?state=loading|empty|error|success|no-permission` — local preview states **only**. Without a query, page shows the ready state.

Do not deploy with real user/tenant data while routes and guards remain placeholder-only. Do not treat preview query strings as production state sources.

## Verification commands (run in your actual repository)

```bash
npm run build
npm run lint
```

Check all routes/states at 320, 375, 768, 1024, and 1440 CSS pixels. Test mouse-free keyboard navigation, dialog trapping/closing, contrast, dark mode, reduced motion and browser zoom. No build/lint result is asserted by this pack because the actual frontend package manifest and installed modules were not supplied.

## Content and security boundaries

The workspace list is intentionally fictional and must remain in `src/mocks/workspaces.ts`. Submit buttons in auth and create-workspace only validate UI and report that no server operation occurred. Backend contracts, authorization enforcement, project visibility, actual workspace switching and approved routes are separate future tasks.
