---
name: DeliveryPilot
description: Delivery commitments with their context.
colors:
  background: "#f8fafc"
  foreground: "#0f172a"
  card: "#ffffff"
  card-foreground: "#0f172a"
  popover: "#ffffff"
  popover-foreground: "#0f172a"
  primary: "#1d4ed8"
  primary-foreground: "#ffffff"
  secondary: "#e2e8f0"
  secondary-foreground: "#0f172a"
  muted: "#f1f5f9"
  muted-foreground: "#475569"
  accent: "#dbeafe"
  accent-foreground: "#1e40af"
  destructive: "#b91c1c"
  destructive-foreground: "#ffffff"
  border: "#cbd5e1"
  input: "#64748b"
  ring: "#1d4ed8"
  dark-background: "#0b1220"
  dark-foreground: "#f8fafc"
  dark-card: "#111c2e"
  dark-card-foreground: "#f8fafc"
  dark-popover: "#111c2e"
  dark-popover-foreground: "#f8fafc"
  dark-primary: "#93c5fd"
  dark-primary-foreground: "#0b1220"
  dark-secondary: "#1e293b"
  dark-secondary-foreground: "#f8fafc"
  dark-muted: "#1e293b"
  dark-muted-foreground: "#cbd5e1"
  dark-accent: "#1e3a5f"
  dark-accent-foreground: "#f8fafc"
  dark-destructive: "#fca5a5"
  dark-destructive-foreground: "#450a0a"
  dark-border: "#64748b"
  dark-input: "#64748b"
  dark-ring: "#93c5fd"
typography:
  display:
    fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
    fontSize: "2.25rem"
    fontWeight: 700
    lineHeight: 1.25
    letterSpacing: "-0.025em"
  headline:
    fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
    fontSize: "1.875rem"
    fontWeight: 600
    lineHeight: 1.25
    letterSpacing: "-0.025em"
  title:
    fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
    fontSize: "1.25rem"
    fontWeight: 600
    letterSpacing: "-0.025em"
  body:
    fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
    fontSize: "0.875rem"
    fontWeight: 500
rounded:
  sm: "0.375rem"
  md: "0.5rem"
  lg: "0.625rem"
  xl: "0.875rem"
spacing:
  "1": "0.25rem"
  "2": "0.5rem"
  "3": "0.75rem"
  "4": "1rem"
  "6": "1.5rem"
  "8": "2rem"
  "12": "3rem"
  "16": "4rem"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.primary-foreground}"
    rounded: "{rounded.md}"
    padding: "8px 16px"
  button-outline:
    backgroundColor: "{colors.background}"
    textColor: "{colors.foreground}"
    rounded: "{rounded.md}"
    padding: "8px 16px"
  button-ghost:
    textColor: "{colors.foreground}"
    rounded: "{rounded.md}"
    padding: "8px 16px"
  button-link:
    textColor: "{colors.primary}"
    rounded: "{rounded.md}"
    padding: "8px 16px"
  input:
    textColor: "{colors.foreground}"
    rounded: "{rounded.md}"
    padding: "4px 12px"
  badge-secondary:
    backgroundColor: "{colors.secondary}"
    textColor: "{colors.secondary-foreground}"
    padding: "4px 8px"
  badge-outline:
    textColor: "{colors.foreground}"
    padding: "4px 8px"
  card:
    backgroundColor: "{colors.card}"
    textColor: "{colors.card-foreground}"
    rounded: "{rounded.xl}"
    padding: "24px 0"
---

# Design System: DeliveryPilot

## Overview

**Creative North Star: "Connected context"**

A calm, accountable interface uses cool neutral surfaces, semantic blue emphasis, system typography and fine separators to keep relationships understandable. Depth is restrained and information remains explicit in both themes.

The finished homepage expresses this through a connected delivery record, varied editorial sections and a linked workflow. These are observed homepage patterns, not mandatory compositions for every future screen.

This extracted record is subordinate to [UI-RULES.md](docs/ui/UI-RULES.md), [AGENTS.md](AGENTS.md) and the frozen [CSS source](src/index.css). CSS remains the implementation authority. Frontmatter records existing values and grants no permission to change them. Product boundaries remain in [the blueprint](docs/product.md).

**Key Characteristics:**

- Semantic light and dark color roles.
- System typography and a four-pixel spacing rhythm.
- Explicit relationships, readable labels and modest preview claims.

## Colors

The light canvas is cool and pale; dark mode uses deep blue neutrals. Unprefixed frontmatter keys record light roles. Matching dark-prefixed keys are exact dark replacements, selected through the existing .dark CSS mapping; they are not an additional palette to mix into a screen.

### Primary

- **Primary blue:** main actions, meaningful emphasis, structural illustrations and the workflow surface; pair with primary-foreground.
- **Accent blue surface:** subtle interactive emphasis, illustrative baseline panel and closing invitation; pair with accent-foreground.

### Neutral

- **Background / foreground:** page canvas and principal text.
- **Card / popover:** bounded records and raised content with paired foregrounds.
- **Secondary / muted:** quiet groups, secondary controls and supporting text.
- **Border / input / ring:** separators, field boundaries and visible focus.
- **Destructive:** existing error and destructive-action roles, not a marketing status palette.

**The Semantic Pair Rule.** Use each surface with its paired foreground; status meaning also needs text.

No tonal ramps are synthesized: the frozen-color rule permits the existing theme roles only.

## Typography

**Display Font / Body Font:** the same system sans stack recorded in frontmatter. No separate display, label or monospace font is introduced. Existing weights are regular (400), medium (500), semibold (600) and bold (700).

### Hierarchy

- **Display:** bold hero with tight leading and tracking; maximum size is text-4xl.
- **Headline:** semibold section headings with tight leading and tracking.
- **Title:** semibold article and record headings; text-2xl and text-lg also serve this hierarchy.
- **Body:** text-base by default; editorial paragraphs use relaxed leading (1.625). Hero supporting copy uses text-lg.
- **Label:** text-sm navigation, metadata, captions and statuses. Essential body copy never moves to text-xs.

The complete existing scale is xs (0.75rem), sm (0.875rem), base (1rem), lg (1.125rem), xl (1.25rem), 2xl (1.5rem), 3xl (1.875rem), 4xl (2.25rem). Balanced headings and bounded paragraphs support scanning without enlarging it.

**The System Type Rule.** Keep the existing system sans stack and type scale, capped at text-4xl.

## Layout

The spacing unit is 0.25rem; approved steps are in frontmatter. Public content uses max-w-6xl (72rem), app content max-w-7xl (80rem), and auth content max-w-md (28rem). Marketing gutters are 1rem, increasing to 1.5rem at md. Sections generally use 3rem vertical padding, increasing to 4rem at md; major groups use 3rem gaps.

Compositions start in one column and introduce two columns at md (768px). The hero uses a 5/7 split within twelve columns at lg (1024px). Copy and actions precede the complete record on mobile. Editorial capabilities mix a featured accent panel, border-separated articles and a compact outcome group. Role responsibilities use separated rows rather than a repeated card grid.

The workflow stays vertical through tablet and becomes three columns with a horizontal connector at xl (1280px). Circular markers are 3rem; the narrow layout reserves 4rem beside the rail. The connected-record rail uses 1.5rem icon containers below sm (640px) and 2rem thereafter. Its content padding is 1rem below sm and 1.5rem thereafter, preserving text room at 320px.

The sticky header has a 4rem minimum row. Section navigation is inline at lg and uses Sheet below lg. Header sign-in and primary actions appear from md. Section anchors have a 4rem scroll offset. Controls wrap and long labels remain breakable. The app shell retains its existing 16rem desktop sidebar and mobile Sheet; route and shell contracts do not change.

## Elevation & Depth

Depth combines tonal surfaces, thin separators and restrained shadows. Small shadow: 0 1px 2px rgb(15 23 42 / 0.08). Medium shadow: 0 4px 12px rgb(15 23 42 / 0.12). Cards, fields and outlined controls use small; the featured record, Sheet and Dialog use medium. No gradients, glows or decorative depth effects are established.

**The Restrained Depth Rule.** Use the two existing shadows for contained records and overlays; ordinary separation uses borders and tonal surfaces.

## Shapes

All corners derive from the existing base radius (0.625rem); extracted results are in frontmatter. Medium corners frame controls and compact outcome groups. Extra-large corners frame cards and feature panels. Full rounding is reserved for existing badge pills and workflow markers. Thin solid borders separate records and responsibilities. The illustrative revision uses a dashed branch beside the approved baseline; this is an observed relationship device, not a new status primitive.

## Components

### Buttons

Existing shadcn variants are default, destructive, outline, secondary, ghost and link. Homepage actions use default, outline, ghost and link. Default controls have a 2.75rem minimum height, medium corners, small medium-weight labels and 0.5rem by 1rem padding; direct SVG children reduce horizontal padding to 0.75rem. Primary hover uses the existing 90% primary treatment; outline and ghost use the accent pair. Link hover underlines. Focus uses ring; disabled controls retain the existing dimmed treatment. Homepage labels may wrap. Keep one emphasized primary action per surface.

### Cards / Containers

Generated Card uses extra-large corners, a border, card colors, small shadow, 1.5rem vertical padding and gaps. Header/content horizontal padding is 1.5rem, with the narrow record exception in Layout. Editorial articles use semantic HTML and separators when a boxed data group is unnecessary.

### Inputs / Fields

Input uses a transparent background, input border, medium corners, small shadow, base text, 0.25rem by 0.75rem padding and a 2.75rem minimum height. Focus uses the ring border and existing ring treatment; invalid state uses destructive and disabled state dims. Pair with visible Label and associated error content. The homepage has no form.

### Badges

Existing pills use small medium-weight text, 0.25rem by 0.5rem padding and a thin border. The homepage uses secondary and outline variants for example, version and work labels. These composition labels wrap where needed. Their text supplies meaning independently of color.

### Navigation

The wordmark is bold system text with primary emphasis on Pilot. Inline links are small and medium weight, muted at rest and foreground on hover. Small-screen navigation uses the existing Radix Sheet, labelled title/description, close controls and focus management. Section navigation preserves native anchor focus on close. The public shell supplies a skip link and focusable main landmark.

### Connected delivery record

An explicitly illustrative figure composes Card, Badge, Separator, a thin vertical rail and existing structural Lucide icons. Requirement and work remain connected while QA verification, client acceptance and release are separate labelled outcomes. The baseline example preserves approved version 2 alongside proposed version 3. Neither is a live approval or write.

Functional color, opacity and disclosure transitions use existing 150ms ease-out treatments. Reduced-motion CSS limits transition/animation duration to 0.01ms and removes smooth scrolling. No decorative choreography is added. Sidecar snippets illustrate styling; application components remain the behavior authority.

## Do's and Don'ts

### Do:

- Do compose existing shadcn primitives and semantic HTML.
- Do retain readable wrapping, visible focus, reduced motion and both themes.
- Do label illustrative records and keep work, verification, acceptance and release distinct.

### Don't:

- Don't change frozen tokens, generated primitives, dependencies or routes without explicit approval.
- Don't add fonts, colors, gradients, decorative imagery, motion or component variants.
- Don't turn role labels, example approvals or preview actions into authorization or successful-write claims.

Sources checked: PRODUCT.md; docs/product.md; docs/ui/UI-RULES.md; docs/ui/AGENT-BRIEF.md; docs/frontend/architecture.md; AGENTS.md; the homepage surface brief; src/index.css; components.json; generated UI primitives; finished marketing feature and header/footer source. The narrow review screenshot corroborates the responsive structure. This extraction does not replace finish review or accessibility testing. There are no shipping raster assets. Pending product contracts and customer validation remain outside this visual record.
