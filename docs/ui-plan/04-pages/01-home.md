# Page 01 — Home

| Item    | Value                                                                                         |
| ------- | --------------------------------------------------------------------------------------------- |
| Status  | **Existing** — documented as built (D1). Changes follow `docs/frontend/homepage-redesign.md`. |
| Route   | `ROUTES.home` → `/`                                                                           |
| Layout  | `PublicLayout` (`MarketingHeader`, `MarketingFooter`)                                         |
| Feature | `src/features/marketing/*`, page `src/pages/HomePage.tsx`                                     |
| Roles   | Anonymous and signed-in visitors                                                              |
| Entry   | Direct visit, logo link                                                                       |
| Exit    | "Open the app" → `/workspaces` (signed in) or `/sign-in`; "Create account" → `/sign-up`       |

## 1. Purpose

Explain what DeliveryPilot does today and route visitors to sign in or sign up. Copy must not promise next-release features (UI-CNT-02, UI-RULES guardrail).

## 2. Wireframe (desktop ≥1024px)

```
┌───────────────────────────────────────────────────────────────────────┐
│ [Logo] DeliveryPilot             Product  How it works   [Sign in] [Create account] │
├───────────────────────────────────────────────────────────────────────┤
│  HomeHero:  H1 headline                     │  DeliveryRecord (sample  │
│  Supporting paragraph                        │  record illustration of  │
│  [Open the app]  [Create account]            │  a delivery trace, text) │
├───────────────────────────────────────────────────────────────────────┤
│ ProblemSection        – 3 cards                                        │
│ CapabilitiesSection   – capability cards (MVP only)                    │
│ HowItWorksSection     – numbered steps                                 │
│ AudienceSection       – who it is for                                  │
├───────────────────────────────────────────────────────────────────────┤
│ MarketingFooter                                                        │
└───────────────────────────────────────────────────────────────────────┘
```

Mobile (<768px): header collapses to logo + menu `Sheet`; hero becomes single column, record below text.

## 3. Component tree

```
PublicLayout
└─ HomePage
   ├─ HomeHero        { }                     features/marketing/HomeHero.tsx
   │  └─ DeliveryRecord { }
   └─ HomeSections
      ├─ ProblemSection, CapabilitiesSection, HowItWorksSection, AudienceSection
```

## 4. Data

Static copy only. No mock records, no API.

## 5. Actions

| Control        | Result                                                                    |
| -------------- | ------------------------------------------------------------------------- |
| Open the app   | Navigate `ROUTES.workspaces` (guard redirects to sign-in when no session) |
| Create account | Navigate `ROUTES.signUp`                                                  |
| Header anchors | Scroll to section id (`homeNavigation.ts`)                                |

## 6. States

Static page: ready only. Loading/empty/error/no-permission are not applicable (no data dependency); this is the one documented exception to UI-STA-01 and is already accepted in the codebase.

## 7. Responsive & accessibility

Skip link to `main`; one `h1`; sections use `h2`; reduced-motion removes reveal transitions (`revealClass`). Check 320/375/768/1024/1440.

## 8. Acceptance criteria

- [ ] No capability marked as available that has no implemented page (Backlog, Sprints, AI insights).
- [ ] Both CTAs reachable by keyboard in order; visible focus.
- [ ] No horizontal scroll at 320px; both themes pass contrast.
