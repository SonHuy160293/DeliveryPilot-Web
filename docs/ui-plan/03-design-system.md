# 03 — Design system: token reference and component specs

**This file does not define tokens.** `src/index.css` is the single source of truth and `docs/ui/UI-RULES.md` is the rulebook (UI-TKN-01…07, UI-CMP-01…03). Changing either needs explicit approval. This file (a) maps tokens to their use in the planned pages and (b) specifies the **new compositions** the pages need, built only from existing primitives.

## 1. Token reference (read-only)

| Purpose                                    | Tailwind class                                             | CSS variable                          | Light value (for reference only) |
| ------------------------------------------ | ---------------------------------------------------------- | ------------------------------------- | -------------------------------- |
| Page canvas                                | `bg-background`                                            | `--background`                        | #f5f5f3                          |
| Body text                                  | `text-foreground`                                          | `--foreground`                        | #181817                          |
| Raised surface (cards, dialogs)            | `bg-card`, `bg-popover`                                    | `--card`, `--popover`                 | #ffffff                          |
| Main action (one per surface)              | `bg-primary text-primary-foreground` (Button `default`)    | `--primary`                           | #181817 (ink)                    |
| Quiet surface, secondary text              | `bg-muted`, `text-muted-foreground`                        | `--muted`, `--muted-foreground`       | #efefec, #666663                 |
| Subtle interactive surface                 | `bg-secondary`, `bg-accent text-accent-foreground`         | `--secondary`, `--accent`             | #efefec, #fff2e9 / #b3440a       |
| Brand highlight (active nav marker, focus) | `bg-brand`, `text-brand-strong`, `ring-ring`               | `--brand`, `--brand-strong`, `--ring` | #ff782e, #b3440a, #d9560f        |
| Callout / notice band                      | `bg-callout text-callout-foreground border-callout-border` | `--callout*`                          | #fff8f2 / #b3440a / #f7ddca      |
| Errors, destructive actions                | `text-destructive`, Button `destructive`                   | `--destructive`                       | #b91c1c                          |
| Borders / inputs                           | `border-border`, `border-input`                            | `--border`, `--input`                 | #e7e7e3, #8a8a86                 |
| Avatars (initials)                         | `bg-avatar-1…6 text-avatar-1…6-foreground`                 | `--avatar-1…6`                        | 6 tone pairs                     |

Dark mode values exist for every token under `.dark`; never use raw colors in TSX (UI-TKN-01).

**Typography** (UI-TKN-05): `--dp-font-sans` (Inter, system stack). Page title `text-2xl font-semibold` (`md:text-3xl`), section title `text-lg font-semibold`, body `text-base`, secondary `text-sm text-muted-foreground`, table header `text-sm font-medium`. `text-xs` only for non-essential meta (e.g. counter "120 / 160").

**Spacing** (UI-TKN-04): steps 1, 2, 3, 4, 6, 8, 12, 16 only. Page sections `space-y-8`; card inner `p-4 md:p-6`; form field stack `space-y-2`; form groups `space-y-6`; toolbar `gap-3`.

**Radius** (UI-TKN-03): base `--radius: 0.75rem`; cards `rounded-xl`, inputs/buttons `rounded-md`, badges `rounded-full`.

**Elevation** (UI-TKN-06): cards `shadow-sm`; dialogs/popovers `shadow-md`. Nothing else.

**Motion** (UI-MOT-01/02): 100–180 ms ease-out on focus, dialog, disclosure; removed under `prefers-reduced-motion`.

**Layout** (UI-LAY-02/03): app content `max-w-7xl`, auth `max-w-md`, marketing `max-w-6xl`. 1 column default, 2 columns `md:` (768px), 3 columns `xl:` (1280px). Sidebar 16rem from `md:`; `Sheet` below.

## 2. Primitive inventory (generated, frozen)

| Primitive (`src/components/ui`)                    | Variants available                                                                                                      | Used for                                   |
| -------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- | ------------------------------------------ |
| `Button`                                           | `default`, `destructive`, `outline`, `secondary`, `ghost`, `link`; sizes `default` (min-h-11), `xs`, `sm`, `lg`, `icon` | Actions; `asChild` + `Link` for navigation |
| `Badge`                                            | `default`, `secondary`, `destructive`, `outline`, `ghost`, `link`                                                       | Status, role, share state                  |
| `Alert`                                            | `default`, `destructive`                                                                                                | Inline errors, notices, success status     |
| `Card`                                             | —                                                                                                                       | Grouped content, list cards                |
| `Dialog`                                           | —                                                                                                                       | Create forms, confirmations                |
| `Sheet`                                            | —                                                                                                                       | Mobile nav, mobile filters                 |
| `Tabs`                                             | —                                                                                                                       | Engagement and project sub-areas           |
| `Input`, `Textarea`, `Label`, `Checkbox`, `Select` | —                                                                                                                       | Forms                                      |
| `Breadcrumb`, `Separator`, `Skeleton`              | —                                                                                                                       | Navigation, separation, loading            |

## 3. Existing compositions to reuse

| Composition                     | File                                                  | Props (summary)                                                                                                 |
| ------------------------------- | ----------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| `PageHeader`                    | `src/components/PageHeader.tsx`                       | `title`, `description?`, `breadcrumbs?: {label, to?}[]`, `action?`                                              |
| `PageStateGate` / `ScreenState` | `src/components/PageStateGate.tsx`, `ScreenState.tsx` | `state`, `scope`, `empty?`, `presentation?`                                                                     |
| `EmptyState`                    | `src/components/EmptyState.tsx`                       | `title`, `description`, `action?`                                                                               |
| `SectionHeading`                | `src/components/SectionHeading.tsx`                   | `eyebrow?`, `title`, `description?`                                                                             |
| `ReadState` / `LoadMore`        | `src/features/workspaces/components/ReadState.tsx`    | `query`, `queryKey`, `scope`, `empty?`, `emptyTitle?`, `emptyDescription?`, `emptyAction?`                      |
| `ConfirmAction`                 | `…/components/ConfirmAction.tsx`                      | `label`, `target`, `consequence`, `reasonMode: none/optional/required`, `pending`, `error`, `onConfirm(reason)` |
| `FormField` / `TextareaField`   | `…/components/FormField.tsx`                          | `id`, `label`, `error?`, `children`                                                                             |
| `ApiFeedback` / `RefreshButton` | `…/components/ApiFeedback.tsx`                        | `error?`, `write?`, `kind: success/info`                                                                        |
| `RoleBadges`                    | `…/components/RoleBadges.tsx`                         | role list → `Badge` row                                                                                         |

**Promotion rule:** `ReadState`, `ConfirmAction`, `FormField`, `ApiFeedback` live in `features/workspaces`. Engagements/Projects must not import from another feature (architecture.md). Backlog task T1-01 promotes them to `src/components/` unchanged (move + re-export), so all features share one copy.

## 4. New compositions (to build in Phase 1)

All are compositions of the primitives above (UI-CMP-02). Each lives in `src/components/` and stays ≤180 lines.

### 4.1 `DataTable`

Semantic `<table>` inside a `Card` on `md:` and up; stacked `Card` list below `md:`.

```ts
interface DataTableColumn<Row> {
  id: string;
  header: string; // visible text, sentence case
  cell: (row: Row) => ReactNode;
  srOnlyHeader?: boolean; // e.g. actions column → "Actions"
  align?: "start" | "end"; // numbers/money: "end"
  hideBelow?: "md" | "xl"; // column hidden in compact layouts
}
interface DataTableProps<Row> {
  caption: string; // <caption class="sr-only">
  columns: readonly DataTableColumn<Row>[];
  rows: readonly Row[];
  rowKey: (row: Row) => string;
  rowHeader: (row: Row) => ReactNode; // first cell rendered as <th scope="row">; mobile card title
  onLoadMore?: () => void; // renders LoadMore button
  hasMore?: boolean;
  loadingMore?: boolean;
}
```

| State        | Presentation                                                                                       |
| ------------ | -------------------------------------------------------------------------------------------------- |
| Default      | Header row `bg-muted text-sm font-medium`; rows `border-b border-border`; row hover `bg-secondary` |
| Focus        | Row-header link gets `focus-visible:ring-2 ring-ring`; rows themselves are not focusable           |
| Loading      | Parent shows 5 `Skeleton` rows `h-12` with `role="status"` "Loading <caption>"                     |
| Load more    | `Button variant="outline"` "Load more"; while pending: disabled + "Loading…"                       |
| Mobile (<md) | Each row = `Card`; `rowHeader` as title; other cells as `<dl>` term/value pairs                    |

### 4.2 `StatusBadge`

Maps a domain status to a `Badge` variant **plus text** (never color alone, UI-A11Y-03).

```ts
type StatusTone = "neutral" | "active" | "attention" | "ended";
interface StatusBadgeProps {
  label: string;
  tone: StatusTone;
}
```

| Tone        | Badge variant                        | Domain values                                                                                                          |
| ----------- | ------------------------------------ | ---------------------------------------------------------------------------------------------------------------------- |
| `active`    | `default`                            | Engagement Active, Project Active, Milestone Achieved, Participant Active, Share Shared, Invitation Accepted           |
| `neutral`   | `secondary`                          | Project Draft, Milestone Planned, Invitation Pending, Share Internal                                                   |
| `attention` | `outline` + `text-accent-foreground` | Milestone Missed, Invitation Expired, Link code outstanding, "No active administrator"                                 |
| `ended`     | `ghost` + `text-muted-foreground`    | Engagement Closed, Milestone Retired, Participant Removed/Revoked/Left, Invitation Declined/Cancelled, Share Withdrawn |

Status labels (exact text): `Active`, `Closed`, `Draft`, `Planned`, `Achieved`, `Missed`, `Retired`, `Pending`, `Accepted`, `Declined`, `Cancelled`, `Expired`, `Removed`, `Revoked`, `Left`, `Shared`, `Internal`, `Withdrawn`.

### 4.3 `FilterBar`

```ts
interface FilterBarProps {
  search?: {
    id: string;
    label: string;
    value: string;
    onChange: (v: string) => void;
    placeholder?: string;
  };
  filters?: readonly {
    id: string;
    label: string;
    value: string;
    options: readonly { value: string; label: string }[];
    onChange: (v: string) => void;
  }[];
  resultCount?: number; // announced via role="status": "3 projects"
  onReset?: () => void; // "Clear filters" ghost button, shown when any filter ≠ default
}
```

Layout: `flex flex-col gap-3 md:flex-row md:items-end`. Each control has a visible `Label` (UI-FRM-01). Search filters client-side over the loaded page only; copy below the input: "Searches loaded results." when `hasMore`. Filter values sync to URL search params (`status`, `kind`, `q`) so back/forward works.

### 4.4 `FormDialog`

Wraps `Dialog` + React Hook Form + Zod for create/edit forms.

```ts
interface FormDialogProps<TValues> {
  title: string; // "Create engagement"
  description?: string;
  trigger: ReactNode; // Button
  submitLabel: string; // verb first: "Create engagement"
  schema: ZodType<TValues>;
  defaultValues: TValues;
  onSubmit: (values: TValues) => Promise<"done" | "keep-open">;
  children: (form: UseFormReturn<TValues>) => ReactNode; // fields
}
```

| State              | Behavior                                                                                                                         |
| ------------------ | -------------------------------------------------------------------------------------------------------------------------------- |
| Idle               | Submit `Button default`; Cancel `Button outline`                                                                                 |
| Validating         | Errors on blur / after submit (UI-FRM-02), `aria-invalid`, `aria-describedby`                                                    |
| Submitting         | Submit disabled, label "Saving…", fields `readOnly`; Esc and Cancel still close only after confirm "Discard changes?" when dirty |
| Server field error | Mapped to field via `useServerFieldErrors` pattern                                                                               |
| Server error       | `Alert destructive` at top of dialog body with what happened + safe next step                                                    |
| Conflict 409       | `Alert` "Someone else changed this. Reload to see the latest version." + `Button outline` "Reload"                               |
| Success            | Dialog closes, focus returns to trigger, parent shows `Alert role="status"` (see 4.6)                                            |

### 4.5 `ReasonField`

`Textarea` with label "Reason" (+ " (optional)" when optional), max 2000, counter, used for close/reopen, milestone date change, agreement change, waiver, withdrawal. Required-ness is a prop: `required: boolean`.

### 4.6 `StatusMessage` (toast substitute, OQ-UI-07)

```ts
interface StatusMessageProps {
  message: string | null;
  onDismiss: () => void;
}
```

`Alert` default variant with `role="status"`, placed directly under `PageHeader`, dismiss `Button ghost size="sm"` "Dismiss". Auto-clears on route change; never auto-hides on a timer (WCAG 2.2.1). Mock-backed writes append " (sample data — not saved to a server)" (UI-STA-04).

### 4.7 `PersonCell`

Avatar initials (`bg-avatar-N`, N = stable hash of userId mod 6 + 1) + display name + optional secondary line (email or "Guest"). When the name lookup fails: "Name unavailable" in `text-muted-foreground` (OQ-UI-08).

### 4.8 `DefinitionList`

`<dl class="grid gap-x-6 gap-y-3 md:grid-cols-3">` (no arbitrary grid templates, UI-COD-05) with `<dt class="text-sm text-muted-foreground">` spanning 1 column and `<dd class="md:col-span-2">`. Empty values render "Not recorded".

### 4.9 `MockDataBanner`

`Alert` with `bg-callout text-callout-foreground border-callout-border`, text: "Sample data. This page is not connected to the server yet; changes are kept only until you reload." Rendered by every page whose repository is the mock implementation (driven by `repository.kind === "mock"`), satisfying UI-STA-04.

### 4.10 `ReadinessChecklist` (project activation)

`<ul>` of items; each item: `CheckCircle2` or `Circle` Lucide icon (`aria-hidden`), label, and text "Done" / "Missing" (text, not icon only). Props: `items: {id, label, done: boolean, hint?: string}[]`.

## 5. Form conventions

| Field type              | Primitive                                | Validation timing | Error text pattern                                              |
| ----------------------- | ---------------------------------------- | ----------------- | --------------------------------------------------------------- |
| Short text              | `Input`                                  | blur + submit     | "Enter a client display name." / "Use 200 characters or fewer." |
| Long text               | `Textarea` + counter                     | blur + submit     | "Use 4000 characters or fewer."                                 |
| Date                    | `Input type="date"`                      | blur + submit     | "Enter the date the agreement was signed."                      |
| Money                   | `Input inputMode="decimal"`              | blur + submit     | "Enter an amount with up to 2 decimal places."                  |
| Code (country/currency) | `Input` uppercase, `maxLength` 2/3       | blur + submit     | "Enter a 2-letter country code, for example VN."                |
| Single choice           | `Select`                                 | change + submit   | "Choose a role."                                                |
| Multi choice            | `Checkbox` group in `<fieldset><legend>` | submit            | "Choose at least one role."                                     |
| URL                     | `Input type="url"`                       | blur + submit     | "Enter a link that starts with https://."                       |

## 6. Feedback patterns

| Situation                          | Pattern                                                                                                                                            |
| ---------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| Page read loading                  | `Skeleton` blocks + `role="status"` label                                                                                                          |
| Page read error (network/5xx)      | `ScreenState error` + "Try again" (`RefreshButton`)                                                                                                |
| Resource not found / not permitted | `ScreenState no-permission`-style single message: "This <thing> isn't available. It may not exist, or you may not have access." + "Back to <list>" |
| Write success                      | `StatusMessage`                                                                                                                                    |
| Write validation error             | Field errors                                                                                                                                       |
| Write rejected (403)               | `Alert destructive` "You no longer have permission to do this." + refetch capability                                                               |
| Rate limited (429)                 | `RetryDelay` pattern from workspaces (countdown text)                                                                                              |
| Conflict (409 stale version)       | Conflict alert (§4.4)                                                                                                                              |
