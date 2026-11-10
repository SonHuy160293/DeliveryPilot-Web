# DeliveryPilot UI plan

Planning package for the DeliveryPilot frontend, written 11 Nov 2026 from the backend repository (`DeliveryPilot/docs`, `src/Modules`) and this repository. It contains **no production code** and makes **no backend calls**.

This plan sits **below** the existing rules. If anything here conflicts with `AGENTS.md`, `docs/ui/UI-RULES.md`, `docs/ui/AGENT-BRIEF.md` or `docs/frontend/*`, those win, and the agent stops with a UI-ESC-01 block.

## Scope in one paragraph

Seven pages already exist and stay connected to the real Identity API (sign-in, sign-up, workspaces, workspace management, join workspace, home, not found). Twelve new page specs cover the MVP features that have backend requirements: **Client Engagement** (FEAT-DP-025), **Project Initialization** (FEAT-DP-004) and **Client Portal** (FEAT-DP-015). They run on mock repositories that can be swapped for HTTP without UI changes. The owner approved every new route and the mock layer on 11 Nov 2026 (backlog T0-01, T0-02). Backlog, Sprints, Requirements, Risks and Health have no backend specs yet, so no pages are planned for them.

## Files

| File                           | Contents                                                                                                                 |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------ |
| `00-findings.md`               | Applied decisions D1–D4, product, roles, entities, workflows, gaps G1–G14, assumptions A1–A8, open questions OQ-UI-01…11 |
| `01-requirements.md`           | Personas, epics E1–E5, UI stories with Given/When/Then + MoSCoW, business rules, lifecycles, permission matrix           |
| `02-sitemap-and-flows.md`      | Sitemap, route table (approved vs proposed), navigation, flows F1–F6 (Mermaid)                                           |
| `03-design-system.md`          | Token reference (read-only), primitive inventory, existing compositions, specs for 10 new compositions                   |
| `04-pages/01…07-*.md`          | Existing pages (documented as built)                                                                                     |
| `04-pages/08…19-*.md`          | New pages, 8-part template: purpose/route, wireframe, component tree, data, actions, states, a11y, acceptance            |
| `05-mock-data/types.md`        | TypeScript types tagged [DTO] / [ERD-DERIVED] / [ASSUMPTION]                                                             |
| `05-mock-data/repositories.md` | Repository interfaces, mock behavior contract, query keys, swap checklist                                                |
| `05-mock-data/*.json`          | Fictional sample records (consistent IDs across files)                                                                   |
| `07-codex-prompts.md`          | 14 ordered, copy-paste prompts for Codex covering the whole backlog, plus a baseline step and final walkthrough          |
| `06-implementation-backlog.md` | Folder structure, ordered tasks T0–T3 with files, dependencies, mock data, definition of done                            |

## Recommended reading order for coding agents

1. `AGENTS.md` → `docs/ui/UI-RULES.md` → `docs/ui/AGENT-BRIEF.md` → `docs/frontend/architecture.md` (mandatory, unchanged).
2. `00-findings.md` §1 and §6 (decisions and gaps), then §8 open questions.
3. `06-implementation-backlog.md` — find your task and its dependencies.
4. `03-design-system.md` — the compositions your task uses.
5. The page spec(s) named in your task (`04-pages/…`), plus `01-requirements.md` §4 and §6 for rules and permissions.
6. `05-mock-data/types.md`, `repositories.md` and the JSON files your task lists.
7. `02-sitemap-and-flows.md` when touching navigation or multi-page flows.

## Page index

| #   | Spec                                                    | Route                                                | Status                    |
| --- | ------------------------------------------------------- | ---------------------------------------------------- | ------------------------- |
| 01  | [Home](04-pages/01-home.md)                             | `/`                                                  | Existing                  |
| 02  | [Sign in](04-pages/02-sign-in.md)                       | `/sign-in`                                           | Existing, connected       |
| 03  | [Sign up](04-pages/03-sign-up.md)                       | `/sign-up`                                           | Existing, connected       |
| 04  | [Workspaces](04-pages/04-workspaces.md)                 | `/workspaces`                                        | Existing, connected       |
| 05  | [Workspace overview](04-pages/05-workspace-overview.md) | `/w/:workspaceSlug?section=`                         | Existing, connected       |
| 06  | [Join workspace](04-pages/06-join-workspace.md)         | `/join-workspace`                                    | Existing, connected       |
| 07  | [Not found](04-pages/07-not-found.md)                   | `*`                                                  | Existing                  |
| 08  | [Engagements](04-pages/08-engagements.md)               | `/w/:workspaceSlug/engagements`                      | New, mock, route approved |
| 09  | [Engagement detail](04-pages/09-engagement-detail.md)   | `/w/:workspaceSlug/engagements/:engagementId`        | New, mock, route approved |
| 10  | [Client links](04-pages/10-client-links.md)             | `/w/:workspaceSlug?section=client-links`             | New, mock, route approved |
| 11  | [Projects](04-pages/11-projects.md)                     | `/w/:workspaceSlug/projects`                         | New, mock, route approved |
| 12  | [Project overview](04-pages/12-project-overview.md)     | `/w/:workspaceSlug/projects/:projectId?tab=overview` | New, mock, route approved |
| 13  | [Project team](04-pages/13-project-team.md)             | `…?tab=team`                                         | New, mock, route approved |
| 14  | [Stakeholders](04-pages/14-project-stakeholders.md)     | `…?tab=stakeholders`                                 | New, mock, route approved |
| 15  | [Project settings](04-pages/15-project-settings.md)     | `…?tab=settings`                                     | New, mock, route approved |
| 16  | [Project recovery](04-pages/16-project-recovery.md)     | `/w/:workspaceSlug?section=projects-recovery`        | New, mock, route approved |
| 17  | [Join project](04-pages/17-join-project.md)             | `/join-project`                                      | New, mock, route approved |
| 18  | [Client sharing](04-pages/18-project-sharing.md)        | `…?tab=sharing`                                      | New, mock, route approved |
| 19  | [Client portal](04-pages/19-client-portal.md)           | `/portal`, `/portal/projects/:projectId`             | New, mock, route approved |
