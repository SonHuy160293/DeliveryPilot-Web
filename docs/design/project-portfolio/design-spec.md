# DeliveryPilot — Project Portfolio Design Specification

> **Status:** Production-Ready Design Specification  
> **Version:** 1.0  
> **Audience:** Product Managers, Design Engineers, Frontend Engineers  
> **Scope:** High-fidelity UI/UX design for the Project Portfolio route inside an Organization Workspace (`/w/:workspaceSlug/projects` or `/w/:workspaceSlug`).

---

## 1. Page Purpose & Product Context

DeliveryPilot is an AI-powered Software Delivery Lifecycle Management Platform crafted for software outsourcing companies and engineering delivery agencies (`docs/product.md`).

- **Entry Point:** The user selects an organization from the personal Organization Portfolio (`/workspaces`), clicks **"Open workspace"** (e.g. *Acme Technologies*), and lands inside that organization's primary working environment: the **Project Portfolio**.
- **Tenant & Scoping Boundary:**
  - An organization is the tenant boundary for ownership, membership, and data isolation.
  - One organization owns multiple concurrent software delivery projects.
  - External **client organizations** (e.g. *Apex Capital*, *Nordic Health*) have scoped access via the Client Portal.
  - Projects can use Scrum (Sprints), Kanban, or a controlled hybrid mode.
- **Primary User Goals:**
  1. Discover, filter, and search software delivery projects belonging to the active organization.
  2. View key project health indicators at a glance (*On Track*, *At Risk*, *Discovery*).
  3. Track progress toward client delivery commitments (e.g. Sprint progress, user stories completed).
  4. Enter a project workspace (*"Open project ↗"*).
  5. Create a new software project (for authorized Delivery Managers / Project Managers / Owners).

---

## 2. Information Architecture (IA)

```
[ App Shell / Navigation ]
 ├── Left Sidebar (Desktop: 240px wide, #F1F5F9 Slate-100 surface)
 │    ├── DeliveryPilot Brand Emblem (44x44px Ocean Blue) + Wordmark
 │    ├── Organization Context Switcher: [Acme Technologies ▾]
 │    ├── Navigation:
 │    │    ├── Projects (Selected: Folder icon, #E0F2FE bg, #0284C7 text)
 │    │    ├── Members & Teams (Users & capacity)
 │    │    ├── Roles & Permissions (Access control)
 │    │    ├── Invitations (Pending member invites)
 │    │    ├── Audit & Activity (Compliance audit trail)
 │    │    └── Workspace Settings (Tenant config)
 │    └── Bottom: User Profile Snapshot ("Alex Morgan")
 │
 └── Main Content Area
      ├── Topbar / Header
      │    ├── Breadcrumbs: Workspaces / Acme Technologies / Projects
      │    ├── Title: "Projects"
      │    ├── Subtitle: "Manage software delivery projects, client commitments, and project workspaces for Acme Technologies."
      │    └── Actions:
      │         ├── Refresh Button (Secondary outline)
      │         ├── "+ Create project" (Primary Solid Ocean Blue #0284C7)
      │         └── User Account Menu Button (Person icon, anchored popover)
      │
      ├── Filter & Search Toolbar
      │    ├── Status Filter Pills: [ All (6) | In Delivery (4) | Discovery (1) | Completed (1) ]
      │    ├── Search Input: "Search projects by name, client, or tag..."
      │    └── Sort Control: "Sort by: Recent activity" (or "Health", "Name")
      │
      ├── Project Cards Grid (3 Columns on Desktop, 2 on Tablet, 1 on Mobile)
      │    └── ProjectCard
      │         ├── Project Avatar (44x44px Multi-hue vector icon badge)
      │         ├── Project Title (17px Bold #0F172A, line-clamp-2)
      │         ├── Client Badge ("Client: Apex Capital")
      │         ├── Delivery Lifecycle Tag ("Sprint 6 · On Track" / "Sprint 8 · At Risk")
      │         ├── Delivery Progress Bar & Metrics (78% · 22/28 stories completed)
      │         ├── Team Avatars Stack (4 assigned members)
      │         └── Footer Action: "Open project ↗" (Full-width touch button)
      │
      └── Pagination Footer
           ├── Counter: "Showing 1–6 of 6 projects"
           └── Controls: Previous / Page 1 / Next
```

---

## 3. Design Tokens & Styling System (Fresh Daylight Ocean & Mint)

Consistent with the platform's established daylight-bright B2B SaaS palette:

| Token Name | Hex Code | Role & Usage |
|:---|:---|:---|
| `--color-canvas-bg` | `#FFFFFF` | Main page canvas background |
| `--color-sidebar-bg` | `#F1F5F9` | Darker light-gray sidebar surface (`Slate-100`) with distinct contrast |
| `--color-card-bg` | `#FFFFFF` | Raised crisp white card surfaces |
| `--color-border` | `#E2E8F0` | Clean, subtle 1px border on cards and dividers |
| `--color-text-primary` | `#0F172A` | Deep slate-navy for titles, headings, and project names |
| `--color-text-secondary`| `#64748B` | Balanced slate for descriptions, client tags, and metadata |
| `--color-brand-primary` | `#0284C7` | Vibrant Ocean Blue for primary `+ Create project` CTA, Brand Mark, active tabs |
| `--color-action-bg` | `#E0F2FE` | Fresh Sky Blue background for card `Open project ↗` actions and active filter pills |
| `--color-action-text` | `#0284C7` | Vibrant Ocean Blue text on sky-tinted action surfaces |
| `--color-status-on-track` | `#059669` / `#D1FAE5` | Emerald green status badge for projects on schedule |
| `--color-status-at-risk` | `#D97706` / `#FEF3C7` | Warm amber status badge for projects with delivery risks |
| `--color-status-discovery`| `#0D9488` / `#CCFBF1` | Cyan teal status badge for early requirement discovery phase |

---

## 4. Component Details & Behavior

### 4.1 Organization Switcher (in Sidebar)
- Positioned directly below the `DeliveryPilot` brand header.
- Displays the active organization logo/initials (`AT`), organization name (*Acme Technologies*), and a small dropdown chevron `▾`.
- Allows instant switching between authorized organizations without returning to `/workspaces`.

### 4.2 Project Card
Each project card represents an active or planned software delivery engagement:
1. **Multi-Hue Avatar (`44×44px`):** Differentiates project domains (FinTech in Sky/Indigo, Healthcare in Mint/Emerald, Retail in Amber, Logistics in Teal).
2. **Project Title (`17px` Bold):** Clear, prominent project naming with `line-clamp-2`.
3. **Client Identifier:** Displays the external client organization (e.g. `Client: Apex Capital`).
4. **Delivery Status Pill:**
   - `Sprint 6 · On Track` (Emerald `#D1FAE5` with pulsing green dot)
   - `Sprint 8 · At Risk` (Amber `#FEF3C7` with warning indicator)
   - `Discovery Phase` (Cyan `#CCFBF1`)
5. **Progress & Velocity:** Lightweight visual progress bar indicating percentage toward milestone/iteration release (e.g., `78% · 22/28 stories`).
6. **Assigned Team Stack:** 3–5 overlapping circular avatar chips showing active engineers/PMs.
7. **Action Button:** Full-width `Open project ↗` button in soft sky blue (`#E0F2FE`), transitioning to solid ocean blue on hover.

---

## 5. Responsive Behavior

- **Desktop (1440px):**
  - 240px fixed left sidebar.
  - 3-column responsive project grid (`xl:grid-cols-3`).
  - Search, status pills, and sort controls on a single horizontal toolbar.
- **Tablet (768px–1024px):**
  - 2-column project grid (`md:grid-cols-2`).
- **Mobile (390px):**
  - Sticky topbar (56px) with brand emblem, title, and person icon menu button.
  - Organization switcher pill bar below topbar.
  - 1-column vertical project card stack (`w-full`).
  - Full-width `+ Create project` button (44px height).
  - Horizontally scrollable status pills.
