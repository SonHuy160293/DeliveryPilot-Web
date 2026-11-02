# Workspaces UI/UX improvement plan

## Executive summary

Improve everyday workspace discovery, creation, entry and switching before refining member and access management. Preserve the existing design system, approved routes, Organization contracts, memory-only session and server authorization. The source audit found a sound integration foundation but also technical language, weak workspace context, and management flows that make users work to identify people and understand consequences.

This document records the approved implementation roadmap and the original source-based audit. Rendered findings remain provisional until a browser review is completed.

## Current assessment and evidence

The feature has paginated discovery, idempotent creation recovery, fresh membership admission, separate authorization checks, lazy management panels and accessible primitives. It lacks a contextual switcher and presents administrative details prominently. Workspace rename/delete and project management are not supported by the supplied contracts and are outside this work.

| ID  | Finding and impact                                                                            | Evidence                                                                  | Priority / size |
| --- | --------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- | --------------- |
| F01 | Switching returns to selection and the shell lacks workspace context; users lose their place. | `src/layouts/AppLayout.tsx`                                               | P1 / M          |
| F02 | Creation recovery exposes technical attempts and can discard useful context.                  | `src/features/workspaces/WorkspaceCreateDialog.tsx`                       | P1 / M          |
| F03 | Confirmations collect a reason even for actions that do not accept one.                       | `src/features/workspaces/components/ConfirmAction.tsx`                    | P1 / M          |
| F04 | Member list rows lack disambiguating information and details follow the entire list.          | `src/features/workspaces/members/MembersPanel.tsx`                        | P1 / M          |
| F05 | Errors can be announced both in a dialog and its parent.                                      | `src/features/workspaces/ownership/NominationActions.tsx`                 | P1 / M          |
| F06 | Discovery lacks filtering and nomination management competes with selection.                  | `src/pages/WorkspacesPage.tsx`                                            | P2 / M          |
| F07 | Overview is mostly a membership summary.                                                      | `src/features/workspaces/components/OwnMembership.tsx`                    | P2 / S          |
| F08 | Role permissions use protocol codes and revision-keyed editors can lose drafts.               | `src/features/workspaces/roles/RoleForm.tsx`                              | P2 / M          |
| F09 | Invitation status, delivery and technical revisions are difficult to distinguish.             | `src/features/workspaces/invitations/InvitationSummary.tsx`               | P2 / M          |
| F10 | Nomination decisions identify workspaces and people by UUID.                                  | `src/features/workspaces/ownership/NominationList.tsx`                    | P2 / M          |
| F11 | Audit exposes identifier filters before common filters.                                       | `src/features/workspaces/audit/AuditFilters.tsx`                          | P2 / M          |
| F12 | Wrapped sections and generic states need responsive and accessibility review.                 | `src/features/workspaces/components/WorkspacePanels.tsx`, `ReadState.tsx` | P2 / M          |

These are source observations and design judgments, not screenshot-based findings. No P0 issue was established.

## Direction and journeys

Retain the existing typography, semantic colors, spacing and component library. Lead with the current workspace and task, disclose advanced actions progressively, name consequential targets, and distinguish invitation delivery from membership. No client-side role label or successful read grants authority.

1. First use: explain how to create a workspace or reopen an invitation.
2. Create: submit a name, then show confirmed creation or safe same-attempt recovery.
3. Find and switch: filter loaded workspaces, load further pages deliberately, choose a workspace and revalidate membership.
4. Manage: identify members and invitations from permitted data, review consequences and get one result message.
5. Respond to invitations or nominations: show the workspace and offered access; keep acceptance, ownership step-down and session changes distinct.

## Roadmap and acceptance

| Task                              | Approach and dependencies                                                                         | Acceptance and verification                                                                    |
| --------------------------------- | ------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| UX-01: confirmations and feedback | Typed none/optional/required reasons; one error owner. No dependencies.                           | Reasonless actions have no reason input; test focus, error announcements and required reasons. |
| UX-02: states and forms           | Improve empty, retry, denial, validation and countdown presentations. Depends on UX-01.           | States provide accurate recovery; test field association, denial cleanup and rate limits.      |
| UX-03: discovery                  | Filter loaded names, retain pagination and disclose nominations. Depends on UX-02.                | Test empty/multiple pages, loaded-only filtering and accessible workspace names.               |
| UX-04: creation                   | Explicit definitive/uncertain recovery; preserve key and payload. Depends on UX-01/02.            | Test replay, timeout, correction, expiry and deliberate abandonment.                           |
| UX-05: switching                  | Feature-owned picker in shell; reuse discovery and admission. Depends on UX-03.                   | Test scope cleanup, fresh admission, denial, focus and account isolation.                      |
| UX-06: overview                   | Orient users and disclose self-management. Depends on UX-01/05.                                   | No unsupported project data; test membership-only access.                                      |
| UX-07: members                    | Show returned identity, status and roles; focused detail and return. Depends on UX-01/02.         | Test duplicate names, long content, focus return and stale revisions.                          |
| UX-08: roles                      | Human labels, explicit editor, preserved dirty drafts and version review. Depends on UX-01/02.    | Test full updates, delegation ceiling, background updates and retirement blocks.               |
| UX-09: invitations                | Disclose issue form, distinguish offer/delivery, clarify resend/replacement. Depends on UX-01/02. | Test action-only access, delivery, new invitation ID, rate limits and proof isolation.         |
| UX-10: ownership                  | Resolve labels only from permitted data; identify nominees. Depends on UX-01/03/07.               | Test missing names, sponsor loss and separate acceptance/demotion.                             |
| UX-11: audit                      | Common filters first; advanced IDs; preserve server ordering. Depends on UX-02.                   | Test typed variants, time boundaries, cursor reset and independent denial.                     |
| UX-12: responsive/accessibility   | Manual tabs, reflow, focus and touch checks. Depends on UX-05–11.                                 | Verify widths 320/375/768/1024/1440, zoom, themes and reduced motion.                          |
| UX-13: verification               | Capture synthetic browser evidence; record results. Depends on UX-01–12.                          | Run all required gates and document actual browser and assistive-technology coverage.          |

## Verification, skills and limits

The audit used Impeccable source detection, UI/UX Pro Max guidance, shadcn composition guidance and Vercel React composition guidance. `frontend-design` was unavailable. No additional packages were installed. The baseline passed typecheck, lint, formatting, 200 tests and build. Playwright MCP was not configured and the browser host was unavailable, so no workspace screenshots or visual compliance claims were produced.

For each delivered slice run `npm run typecheck`, `npm run lint`, `npm run format:check`, `npm run test:run` and `npm run build`. Use the isolated synthetic review harness for visual checks when available. Check keyboard focus, screen-reader announcements, 200% zoom, long content, light/dark themes and reduced motion; tests in jsdom do not establish rendered layout or WCAG conformance.

Filtering is limited to loaded discovery pages. Workspace context, badges and visible actions do not grant permissions. Keep invitation proofs out of URLs after capture, caches, storage and logs. Preserve old scope cleanup and cancellation; cancellation does not establish server rollback. Keep the approved routes, tokens, generated primitives and dependencies unchanged. Workspace settings/project workflows require separately verified contracts.
