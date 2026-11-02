# DeliveryPilot — Organization Portfolio Design Specification

> **Status:** Production-Ready Design Specification  
> **Version:** 2.0  
> **Audience:** Product Managers, Design Engineers, Frontend Implementation Agents  
> **Scope:** Design-only artifact for the personal entry Organization Portfolio route (`/workspaces`).

---

## 1. Page Purpose & Product Context

DeliveryPilot is a multi-tenant B2B SaaS platform specifically crafted for software outsourcing companies and engineering delivery agencies.

- **Role of this Page:** The Organization Portfolio is the **authenticated personal entry point** where a user sees all distinct organizations (tenants) they belong to, can search and switch into an organization workspace, review incoming ownership/membership invitations, or create a new organization.
- **Tenant Isolation Invariant:** One user account can hold memberships across multiple independent organization tenants. Resource visibility, permissions, and project scopes remain strictly partitioned within each tenant. Users must choose and enter an organization before accessing any project workspace.

---

## 2. Information Architecture (IA)

```
[ App Shell / Topbar & Sidebar ]
 ├── Left Sidebar (Desktop: 240px, Mobile: Sheet drawer)
 │    ├── DeliveryPilot Brand Wordmark + Icon
 │    ├── Navigation:
 │    │    ├── Overview (global personal overview)
 │    │    ├── Organizations (Selected state)
 │    │    ├── Invitations (Badge count: '2')
 │    │    └── Settings (Account & preferences)
 │    └── Bottom: User Profile Snapshot (Avatar, Name, Email)
 │
 └── Main Content Area
      ├── Page Header
      │    ├── Title: "Your organizations"
      │    ├── Subtitle: "Manage the organizations and projects you're part of."
      │    └── Primary Action: "+ Create organization" (Soft Pastel Action)
      │
      ├── Pending Invitations Callout (Rendered only when pending count > 0)
      │    ├── Envelope Icon + Notice: "You have 2 pending invitations waiting"
      │    └── Action: "Review invitations →" (Secondary link/action)
      │
      ├── Search, Filter & View Controls
      │    ├── Filter Tabs: [ All (5) | Active (5) | Pending invitations (2) ]
      │    ├── Search Input: "Search organizations by name..."
      │    └── Sort Dropdown: "Sort by: Name" (or "Recently added")
      │
      ├── Organization Cards Grid (3 Columns on Desktop, 2 on Tablet, 1 on Mobile)
      │    └── OrganizationCard (Strict Data Boundary)
      │         ├── Organization Logo (36x36px rounded square with Fallback Initials)
      │         ├── Organization Name (Heading 3, line-clamp-2)
      │         ├── Contextual Metric: "[FolderIcon] X accessible projects"
      │         └── Footer Action: "Open workspace ↗"
      │
      └── Pagination Footer
           ├── Counter: "Showing 1–5 of 5 organizations"
           └── Controls: Previous / Page Numbers / Next
```

---

## 3. Design Tokens & Styling System

Following the strict **Soft Blue-Gray** design direction with calm, non-vibrant contrast and no eye-fatiguing saturated blues, neons, or gradients.

### 3.1 Color Palette (Fresh Daylight Ocean & Mint System)

| Token Name               | Hex Code  | Role & Usage                                                                                |
| :----------------------- | :-------- | :------------------------------------------------------------------------------------------ |
| `--color-main-bg`        | `#FFFFFF` | Crisp daylight main canvas surface                                                          |
| `--color-sidebar-bg`     | `#F8FAFC` | Airy cool-alabaster sidebar surface for fresh content separation                            |
| `--color-card-bg`        | `#FFFFFF` | Raised crisp white card surfaces                                                            |
| `--color-border`         | `#E2E8F0` | Subtle, crisp 1px borders on cards and dividers                                             |
| `--color-border-subtle`  | `#EDF2F7` | Inner card footer dividers and subtle outlines                                              |
| `--color-primary-text`   | `#0F172A` | Deep slate-navy for headings, titles, high-emphasis text                                    |
| `--color-secondary-text` | `#64748B` | Balanced slate for descriptions, project counts, secondary info                             |
| `--color-brand-primary`  | `#0284C7` | Vibrant Ocean Blue for primary `+ Create organization` CTA, Brand Mark, and active card CTA |
| `--color-brand-teal`     | `#0D9488` | Fresh Mint-Teal accent for `DELIVERY PLATFORM` sub-label and Pending Invitations callout    |
| `--color-action-bg`      | `#E0F2FE` | Fresh Sky-Blue background for card `Open workspace` actions and active pills                |
| `--color-action-text`    | `#0284C7` | Vibrant Ocean Blue text on sky-tinted action surfaces                                       |
| `--color-action-hover`   | `#0284C7` | Solid Ocean Blue interactive hover state with `#FFFFFF` text                                |
| `--color-secondary-bg`   | `#F0F9FF` | Fresh sky-tinted project count pills and secondary containers                               |
| `--color-invite-bg`      | `#F0FDFA` | Fresh Mint-Teal surface (`#99F6E4` border) for Pending Invitations callout                  |
| `--color-nav-selected`   | `#E0F2FE` | Active sidebar item and active filter tab pill (`#0284C7` text)                             |

### 3.1.1 Multi-Hue Organization Avatar Palette

To give the portfolio lively, energetic visual rhythm without visual noise, organization avatars (`46×46px` rounded-xl) cycle through six harmonious daylight pastel + crisp foreground pairings:

- **Sky Ocean:** `#E0F2FE` bg / `#0284C7` icon & monogram (_Acme Technologies_)
- **Mint Emerald:** `#D1FAE5` bg / `#059669` icon & monogram (_Greenwave Solutions_)
- **Sunlit Amber:** `#FEF3C7` bg / `#D97706` icon & monogram (_Nova Retail_)
- **Cyan Teal:** `#CCFBF1` bg / `#0D9488` icon & monogram (_Orion Systems_)
- **Indigo Sky:** `#E0E7FF` bg / `#4F46E5` icon & monogram (_Vertex Digital_)
- **Coral Rose:** `#FFE4E6` bg / `#E11D48` icon & monogram (_Lumen Health_)

### 3.2 Strict Visual Restrictions

- **Gradients:** Prohibited. All surfaces are flat, solid, high-legibility tones.
- **Glow & Glassmorphism:** Prohibited. No background-blur, glass opacity, or colored halos.
- **Shadows:** Minimal, restrained elevation only (`box-shadow: 0 1px 2px rgba(20, 34, 56, 0.05)`).
- **Rounding:** Uniform `10px` to `12px` border radius across cards and dialogs; `6px` to `8px` for inputs and action buttons.

### 3.3 Typography (Geist Sans System)

| Level               | Size               | Weight           | Line Height | Tracking   | Usage                                                                                    |
| :------------------ | :----------------- | :--------------- | :---------- | :--------- | :--------------------------------------------------------------------------------------- |
| **Display / H1**    | `28px` (1.75rem)   | 600 (SemiBold)   | 1.25        | `-0.025em` | Page Title ("Your organizations")                                                        |
| **Brand Wordmark**  | `21px` (1.3125rem) | 700 (Bold)       | 1.15        | `-0.03em`  | `DeliveryPilot` primary shell brand name (`Delivery` in `#142238`, `Pilot` in `#315A80`) |
| **Brand Sub-label** | `10px` (0.625rem)  | 600 (SemiBold)   | 1.2         | `+0.08em`  | `DELIVERY PLATFORM` descriptor beneath brand wordmark (`#64748B`)                        |
| **Section H2**      | `18px` (1.125rem)  | 600 (SemiBold)   | 1.35        | `-0.02em`  | Section headings / Empty state headers                                                   |
| **Card Title / H3** | `17px` (1.0625rem) | 600 (SemiBold)   | 1.35        | `-0.015em` | Prominent Organization Brand Name on card                                                |
| **Body Regular**    | `14px` (0.875rem)  | 400 (Regular)    | 1.5         | `0`        | Subtitle, descriptions, filter tabs                                                      |
| **Meta / Small**    | `13px` (0.8125rem) | 500 (Medium)     | 1.4         | `0`        | "[Folder] 12 accessible projects", pagination                                            |
| **Monospace**       | `13px` (0.8125rem) | 400 (Geist Mono) | 1.4         | `0`        | Technical IDs (e.g. Org UUID in details/audit)                                           |

---

## 4. Component Specifications

### 4.0 Shell Brand Header (Prominent Logo & BrandName)

- **Desktop Sidebar Brand Zone:**
  - Dedicated top container (`padding: 20px 20px 18px 20px`, bottom divider `1px solid #E2E8F0`) so the platform identity stands out clearly above navigation items.
  - **Logo Mark (`42×42px`):** Solid rounded square (`border-radius: 12px`), deep slate-navy fill (`#142238` or `#315A80`), crisp white geometric paper-plane emblem (`22×22px`, `2px` stroke) centered inside.
  - **BrandName (`DeliveryPilot`):** `21px` Geist Bold (`700`), tight tracking `-0.03em`, two-tone emphasis (`Delivery` in `#142238`, `Pilot` in `#315A80`), paired with a stacked `10px` uppercase sub-label `DELIVERY PLATFORM` (`#64748B`).
- **Mobile Topbar Brand Identity:**
  - `38×38px` solid brand emblem badge + `19px` Geist Bold `DeliveryPilot` wordmark anchored prominently in the sticky topbar (`56px` height).

### 4.1 Header & Primary Action

- **Title:** "Your organizations" (`text-2xl font-semibold text-[#142238]`).
- **Subtitle:** "Manage the organizations and projects you're part of." (`text-sm text-[#64748B]`).
- **Create Organization Action:**
  - Background: `#E1ECF7`
  - Text: `#315A80`
  - Padding: `8px 16px`
  - Height: `38px` (desktop), `44px` (mobile touch target)
  - Icon: Lucide `Plus` (16px) inline-start
  - Radius: `8px`
  - Hover: Background `#D5E4F3` transition 150ms ease-out

### 4.2 Pending Invitations Callout

- Displays above the card grid whenever `pendingInvitations > 0`.
- Surface: Clean card with `#F2F6FA` background, 1px `#E2E8F0` border, `10px` radius.
- Left content: Lucide `Mail` icon (18px) in `#315A80` + text: _"You have **2 pending invitations** waiting for your review."_
- Right action: Button variant link/secondary _"Review invitations →"_, opening the invitations drawer/tab.

### 4.3 Search & Filters Toolbar

- **Filter Tabs (Left):**
  - Segmented pills: `All (5)`, `Active (5)`, `Pending invitations (2)`
  - Active Tab: Background `#E5EDF6`, text `#142238`, font-medium, radius `6px`.
  - Inactive Tab: Transparent background, text `#64748B`, hover text `#142238`.
  - Notification Dot: 6px solid `#315A80` circle beside "Pending invitations".
- **Search Field (Right):**
  - Width: `260px` (desktop), `100%` (mobile)
  - Icon: Lucide `Search` (15px) `#64748B` leading icon
  - Input: Placeholder _"Search organizations..."_, background `#FFFFFF`, border `#E2E8F0`, height `36px`.
- **Sort Dropdown:**
  - Select trigger with label _"Sort by: Name"_, height `36px`.

### 4.4 Organization Card (Strict Data Boundary)

To ensure compliance with the audited backend data contract and eliminate visual clutter, each card strictly contains:

```
┌────────────────────────────────────────────────────────┐
│  ┌────┐                                                │
│  │ AT │   Acme Technologies                            │
│  └────┘   📁 12 accessible projects                    │
├────────────────────────────────────────────────────────┤
│                                 [ Open workspace ↗ ]   │
└────────────────────────────────────────────────────────┘
```

1. **Logo / Fallback Initials (44×44px):**
   - Prominent rounded square (`border-radius: 10px`), solid muted-palette fill or `#E5EDF6` with a subtle `1px` border and bold `16px` monogram/emblem so each organization's brand mark has strong visual presence.
   - Algorithm: First letters of first two words (e.g. "Acme Technologies" → "AT", "Northstar" → "N").
2. **Organization Brand Name:**
   - Text: `17px`, weight `600–700`, color `#142238`, tracking `-0.015em`. Wraps up to 2 lines (`line-clamp-2`), `overflow-wrap: anywhere`.
3. **Accessible Projects Count:**
   - Text: `13px`, color `#64748B`, flex alignment with 14px Lucide `Folder` icon.
   - Example: _"12 accessible projects"_ or _"No accessible projects"_ (when 0).
4. **Card Action ("Open workspace ↗"):**
   - Background: `#E1ECF7`
   - Text: `#315A80`
   - Border radius: `6px`
   - Height: `36px`
   - Icon: Lucide `ArrowUpRight` (14px)
   - Behavior: Links directly to `/w/{organizationId}`.

> **Explicitly Excluded Elements:**
>
> - Role badges (Owner, Admin, PM, Dev) — _excluded to prevent false authority claims at portfolio level._
> - Member count & Member avatars — _excluded to respect privacy and API boundary._
> - Last access dates & Delivery Pulse metrics — _excluded to avoid invented telemetry._

---

## 5. Responsive Layout Specifications

### 5.1 Desktop Layout (1440px viewport)

- **Sidebar:** Fixed width `240px`, background `#F3F5F8`, full height.
- **Main Content:** Max-width `1120px`, centered, margin `32px auto`, padding `0 32px`.
- **Grid Layout:** 3 columns, `grid-template-columns: repeat(3, 1fr)`, gap `20px`.
- **Card Sizing:** Minimum height `148px`, fixed footer boundary.

### 5.2 Mobile Layout (390px viewport - iPhone 14/15)

- **Sidebar:** Hidden by default; accessible via accessible hamburger menu Sheet drawer.
- **Topbar:** Sticky, `56px` height, `#FFFFFF` with `#E2E8F0` border-bottom.
  - Left: Logo icon + Wordmark.
  - Right: User avatar (`32px` circle).
- **Main Container:** Padding `16px 16px 32px 16px`.
- **Header:** Stacked layout:
  - Title & Subtitle.
  - Primary button `+ Create organization`: full width, `44px` height touch target.
- **Filters:**
  - Search input: full width, `40px` height.
  - Filter pills: horizontally scrollable (`flex overflow-x-auto no-scrollbar gap-2`).
- **Card Grid:** 1 column (`grid-cols-1`, gap `12px`).
  - Card button expands to full width on mobile for thumb accessibility: `w-full h-11`.

---

## 6. Comprehensive State Matrix

| State                           | Visual Treatment & Copy                                                                                                                                                                                                                    | User Recovery Action                                        |
| :------------------------------ | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :---------------------------------------------------------- |
| **Normal (Loaded)**             | Clean 3-column card grid, active pagination bar.                                                                                                                                                                                           | User clicks "Open workspace ↗" or filters.                  |
| **Empty (0 Organizations)**     | Centered empty state illustration box with Lucide `Building2` icon, title _"No organizations yet"_, description _"You are not currently part of any organization. Create a new organization or check your email for pending invitations."_ | Primary button: `Create your first organization`.           |
| **No Search Results**           | Inline alert card with Lucide `SearchX` icon: _"No matching organizations found for \"[query]\""_.                                                                                                                                         | Link action: `Clear search filter`.                         |
| **Pending Invitations Present** | Highlighted callout card at top of portfolio with mail icon, badge count, and review CTA.                                                                                                                                                  | `Review invitations →` opens accept/decline modal.          |
| **Zero Accessible Projects**    | Card renders _"0 accessible projects"_ in `#64748B` with a folder icon. No disabled state; user can still open workspace.                                                                                                                  | "Open workspace" opens workspace to request project access. |
| **Long Organization Name**      | Name wraps smoothly to 2 lines (`line-clamp-2`), full name accessible via native `title` attribute or tooltip.                                                                                                                             | Prevents card blowout or horizontal expansion.              |
| **Missing Logo**                | Fallback 2-letter uppercase initials on `#E5EDF6` surface.                                                                                                                                                                                 | Immediate, accessible branding fallback.                    |
| **Loading State**               | Skeleton placeholders matching 3x2 card grid dimensions with subtle 1.5s pulse.                                                                                                                                                            | Accessible screen-reader announcement `aria-busy="true"`.   |
| **Error / 503 State**           | Red-slate alert banner: _"Unable to load your organizations at this time."_                                                                                                                                                                | Action button: `Retry loading`.                             |

---

## 7. Design Critique & Refinement (The 3-Role Review)

### Critique Pass 1 — Senior Product Designer (Workflow & Scope)

- **Finding:** The previous concept showed an "AI Delivery Insight" banner at the very top of the personal portfolio.
- **Resolution:** Removed the banner. The portfolio is an entry hub for routing users to their team workspaces. High-level AI aggregate insights belong inside an individual organization or project dashboard, not here where it pushes core work items below the fold.

### Critique Pass 2 — Senior UI/UX Designer (Visual Hierarchy & Fatigue)

- **Finding:** Having solid vibrant-blue buttons on all 6 cards caused severe visual competition with the `+ Create organization` header CTA.
- **Resolution:** Replaced all card action buttons with the soft pastel blue token (`#E1ECF7` bg, `#315A80` text). The header button `+ Create organization` now uses the same refined palette, eliminating visual noise and creating a serene, cohesive dashboard.

### Critique Pass 3 — Senior Design Reviewer (Edge Cases & Break-UI)

- **Finding:** Long organization names (e.g. _"Bartholomew & Northwind Industrial Solutions International Holding Ltd."_) caused cards to vary in height and broke button alignment.
- **Resolution:** Applied `min-h-[148px]`, `flex flex-col justify-between`, and `line-clamp-2` to the title container, anchoring the footer action to a shared bottom baseline across all cards in the grid.
