# Homepage redesign — 2 Nov 2026

## Result and scope

The public homepage now presents DeliveryPilot as a software delivery management product for engineering and delivery leaders. The redesign replaces customer-visible copy placeholders and repeated card grids with a connected-record hero, a fragmentation comparison, varied capability compositions, a connected workflow, specific role responsibilities, and a closing CTA.

The product remains a mock frontend foundation. Registration and workspace creation do not create records; connected workflows are planned. Examples are labeled illustrative. No customer proof, commercial metrics, AI capability, security certification, or delivery guarantee was invented.

## Visual and UX decisions

- The hero leads with the commitment/evidence proposition and immediately identifies the product category and audience. Get started opens the existing registration preview; Explore the preview opens fictional workspaces.
- The product illustration ties one synthetic requirement version to delivery work. Work done, QA verification, client acceptance, and release remain separate outcomes. Compact nodes and a connection rail remain visible on mobile.
- The problem section contrasts fragmented sources with the intended connected record. The capabilities section mixes one emphasized baseline/revision relationship with editorial feature blocks and distinct outcome labels.
- Approved Version 2 and proposed Version 3 are explicitly separate parts of illustrative REQ-024. The proposal does not replace the baseline.
- Workflow steps share a vertical connector through tablet and a horizontal connector at wide desktop. The tablet layout has no orphan half-row.
- Header section anchors target real, focusable sections. The mobile Sheet closes on selection and preserves focus at the destination instead of returning it to the sticky menu. Escape returns focus to Menu.
- Existing semantic primary/accent surfaces provide contrast and rhythm. System typography, the text-4xl ceiling, spacing, radii, shadows, theme tokens, and generated primitives are preserved. No gradients, imagery, fonts, animation libraries, or other dependencies were added.
- The original public shell remains in use for authentication and non-ready preview states, so hidden homepage sections do not leave broken navigation links.

## Changed files

| File                                             | Responsibility                                                                  |
| ------------------------------------------------ | ------------------------------------------------------------------------------- |
| `src/pages/HomePage.tsx`                         | Small route composition; preserves PageStateGate                                |
| `src/features/marketing/HomeSections.tsx`        | Coordinates the marketing narrative                                             |
| `src/features/marketing/HomeHero.tsx`            | Product proposition, CTAs, and preview disclosure                               |
| `src/features/marketing/DeliveryRecord.tsx`      | Accessible, clearly illustrative connected record                               |
| `src/features/marketing/ProblemSection.tsx`      | Fragmented versus connected context                                             |
| `src/features/marketing/CapabilitiesSection.tsx` | Outcome-oriented capabilities and baseline/proposal illustration                |
| `src/features/marketing/HowItWorksSection.tsx`   | Visually connected three-step intended journey                                  |
| `src/features/marketing/AudienceSection.tsx`     | Responsibilities and closing action                                             |
| `src/layouts/MarketingHeader.tsx`                | Desktop section navigation and accessible mobile Sheet                          |
| `src/layouts/MarketingFooter.tsx`                | Branding and real preview/sign-in links                                         |
| `src/layouts/PublicLayout.tsx`                   | Selects the homepage shell while preserving other public screens                |
| `src/lib/homeNavigation.ts`                      | Pure section IDs and anchor helper shared by shell/tests                        |
| `src/features/marketing/HomePage.test.tsx`       | Nine behavior-oriented homepage tests                                           |
| `src/app/router.test.tsx`                        | Updates the homepage heading expectation                                        |
| `eslint.config.js`, `.prettierignore`            | Exclude vendored skill code and generated question data from application checks |
| `.gitignore`                                     | Ignore local review captures and generated question state                       |
| `.impeccable/surfaces/src-pages-homepage-tsx.md` | Development-only direction contract                                             |
| `DESIGN.md`, `.impeccable/design.json`           | Extracted design-system documentation                                           |

The original product blueprint, root PRODUCT.md, UI rulebook, route map, index.css, components.json, all generated shadcn primitives, package.json, and package-lock.json match the task-start snapshot. No unrelated application feature was changed.

## Skills actually applied

- **UI/UX Pro Max:** queried landing-page and React guidance; applied conversion sequencing, semantic navigation, and accessibility priorities. Its suggested alternative palette, font, and glass effects were rejected in favor of the approved system.
- **shadcn:** reused existing Button, Card, Badge, Separator, and Radix Sheet compositions. Component documentation was checked; no primitive regeneration or package addition occurred.
- **Vercel composition patterns:** kept pages small, sections explicit, and navigation metadata independent of feature internals. No boolean-heavy component framework or speculative state abstraction was introduced.
- **Vercel React best practices:** static content remains outside renders where appropriate, components are imported directly, and no unnecessary effects, memoization, network calls, or heavyweight interaction framework was added.
- **Impeccable:** recorded the code-first surface contract; ran independent design and technical assessments; applied the material correction batch; obtained a scoped final verdict; documented the finished system.
- **break-ui:** absent from project and user skill locations. Its requested long-copy, narrow-width, CTA-wrapping, and text-scaling checks were performed directly; the skill itself was not claimed as used.

## Verification evidence

| Check                         | Result                                                                                                                    |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `npm run typecheck`           | PASS — strict TypeScript                                                                                                  |
| `npm run lint`                | PASS — zero ESLint warnings; UI source/size/contrast checks pass                                                          |
| `npm run format:check`        | PASS for maintained project files                                                                                         |
| `npm run test:run`            | PASS — 67 tests across 5 files                                                                                            |
| `npm run build`               | PASS — Vite 8.3.5, 2,192 transformed modules                                                                              |
| Production SPA document smoke | PASS — HTTP 200 and SPA root at all six approved route matches                                                            |
| Browser console               | No warnings/errors observed in inspected flows                                                                            |
| Responsive layout             | No horizontal overflow at nominal 320, 390, 768, 1024, and 1440px                                                         |
| Theme matrix                  | Light/dark captures at 320, 390, 768, and 1440px; readable text and consistent tokens                                     |
| Navigation                    | Real CTA destinations, section anchors, skip link, sticky header, mobile Sheet selection and Escape/focus return verified |
| Preview states                | Existing loading, empty, error, success and no-permission presentations continue to work                                  |
| Stress checks                 | 200% root text sizing and longer headings/descriptions/CTA labels fit tested widths; temporary fixtures were restored     |

Final build artifacts: HTML 0.53 kB; CSS 50.41 kB (gzip 9.70 kB); JS 384.85 kB (gzip 117.80 kB). No new dependency or media download was added.

The UI source checker verified 32 frozen-token contrast pairs. Independent browser sampling found no sampled text pair below 4.5:1; observed minima were 6.41:1 light and 9.47:1 dark. These measurements do not cover every hover/alpha state or certify WCAG compliance.

## Independent review and final polish

Method: separate fresh-context design and technical reviewers. The design reviewer did not receive detector findings before its assessment. The technical reviewer used its own fresh IAB tab at 1280×720 and ran one bundled source scan: zero primary/advisory findings and no detector ignores or false positives.

The initial technical audit was 16/20, with one P2 navigation-metadata ownership issue. That issue was fixed by moving the pure metadata into lib; the initial audit score was not retroactively changed.

The design review requested three material corrections: preserve mobile visual connections, depict rather than merely describe a proposed revision, and connect the workflow while fixing tablet composition. All were implemented, recaptured, and scored resolved. **Final disposition: ship, covering those three scored corrections.** This is a verdict pass over the fixes, not a new whole-surface audit.

## Screenshots

Local review evidence is intentionally ignored by Git:

- [Before desktop](../../.impeccable/review/before-desktop.jpg) and [before mobile](../../.impeccable/review/before-mobile.jpg).
- [After desktop](../../.impeccable/review/desktop.jpg), [hero detail](../../.impeccable/review/hero.jpg), [tablet](../../.impeccable/review/tablet.jpg), [mobile](../../.impeccable/review/mobile.jpg), and [narrow mobile](../../.impeccable/review/narrow.jpg).
- [Dark desktop](../../.impeccable/review/dark-desktop.jpg), [dark tablet](../../.impeccable/review/dark-tablet.jpg), [dark mobile](../../.impeccable/review/dark-mobile.jpg), and [dark narrow](../../.impeccable/review/dark-narrow.jpg).

Captures were validated from document top through footer. Nominal viewport widths include the scrollbar; capture content widths are 1425, 753, 375, and 305px respectively. No raster assets ship with the application.

## Limits and review items

Actual browser zoom, reduced-motion emulation, physical-device touch, screen readers, axe/Lighthouse, network throttling, and measured Core Web Vitals were not run. Root-font scaling is a text-layout stress test, not a substitute claim for browser zoom. The inherited reduced-motion CSS remains frozen; no decorative animation was added.

CUA evaluate is read-only, so the detector overlay could not be injected. Source scanning, native browser captures, computed DOM checks, and keyboard interactions supplied the available evidence. No injection helper or overlay server was launched.

The copy is grounded in the product blueprint and explicitly distinguishes product direction from implemented preview behavior. Future claims about real account creation, connected workflows, authorization, customer outcomes, or AI require implementation and approved evidence first.
