# Organization integration

The mounted workspace application connects to the 30 browser-facing operations in the sibling backend's [Gateway contract](../../../DeliveryPilot/docs/features/FEAT-DP-003-organization/gateway-api-contract.md) and [integration playbook](../../../DeliveryPilot/docs/features/FEAT-DP-003-organization/frontend-integration.md). All method/path pairs were checked against its on-disk Gateway allowlist. Examples, test records, and synthetic adapters are not live execution evidence.

## Configuration and routes

Use the existing `/identity/` API base and same-origin Gateway/Vite proxy with prefix stripping disabled. No service key belongs in public configuration. The local Gateway must use its actual running origin; browser cookie login cannot assume credentialed cross-origin CORS.

`/workspaces` provides cursor-based eligible workspace discovery, creation, and personal Owner nominations. `/w/:workspaceSlug` uses the server organization UUID in its legacy segment and revalidates own membership before showing local Overview, Members, Roles, Invitations, Ownership, and Audit tabs. No counters, project access, slug resolution, workspace rename/delete, or unsupported search/sort is inferred.

The only additional approved route is `/join-workspace`. Bootstrap validates and scrubs the email fragment before BrowserRouter construction. A feature-owned memory flow supports initial same-tab sign-in, binds the subject/generation, and clears the proof on account change, completion, abandonment, or unmount. Reload requires reopening the original email. Registration also retires the flow: new recipients create an account, sign in, then reopen the original email; account creation alone grants no membership. Proof-bearing POSTs are imperative and never use Query keys, mutation variables/caches, persisted state, or secret-bearing continuation props.

## Contracts and recovery

Feature Zod schemas validate unknown data after strict envelope validation, including positive safe numeric revisions, nullable fields, distinct badge/offer/creation shapes, and 16 typed audit changes. Requests are closed and contain only documented fields. Forms map only known server field keys to safe local messages.

Creation retains one UUID/name intent across dialog closure and uncertain responses. Confirmed 201 and authorized historical replay 200 refresh discovery; current membership is checked independently. Timeout, interrupted/malformed response, and dependency failure may leave the outcome unknown. Conflicting/expired attempts need explicit abandonment and a deliberate new intent; losing memory on reload loses exact-key recovery. A 403 does not establish that an earlier creation failed.

Ordinary mutations never retry automatically or optimistically change access. Reasons, revision conflicts, no-change role operations, protected Admin/Owner reductions, last-Owner continuity, frozen invitation roles, resend versus new-ID reissue, current delivery generation, and caller-specific nomination hints follow the contract. Acceptance adds an Owner; demotion is separate. Invitation acceptance/rejoin never restores historical grants or changes the identity token/email-verification state.

The permission endpoint supplies only held delegable codes. Catalog/member/invitation/audit reads and actions have independent server checks. Action-only callers may issue and inspect their returned offer without invitation enumeration. Other actions need a target/version from permitted reads, self data, or an authorized action result; no target lookup or revision is invented. Expired pending offers can block role retirement, and no public cleanup operation is supplied.

## Cache and lifecycle

Discovery and personal nominations use account prefixes; workspace queries and writes use account/workspace prefixes. Infinite queries keep cursors in pageParam and all shaping filters in keys. No previous-data bridge crosses scope boundaries. Scope transitions remove old scoped queries/mutations, while owned AbortControllers and session-generation checks discard retired results. Cancellation cannot reverse a server commit.

Confirmed writes await targeted invalidation. Protected read denials erase cached data while retaining the active denial to avoid remount/refetch loops. Own-membership denial removes the whole workspace and returns to selection; a resource-only denial preserves other permitted access. Audit pages maintain server order and AND filters; continuation is not a snapshot. Initial and background errors, genuine empty states, disabled pending actions, known success/no-change, and unknown outcomes use safe API-derived presentations rather than `?state=` overrides.

## Workspace experience

The authenticated shell offers a workspace picker backed by the existing account discovery query. The picker and selection page filter only already loaded names and retain cursor-based Load more; neither performs server search or infers access. Switching still passes through workspace cleanup and fresh membership admission. Creation keeps its original attempt across uncertain responses, and deliberately starting over after uncertainty requires acknowledgement.

Management uses action-specific confirmation reasons, human-readable permission and audit labels, distinct invitation delivery information, and contextual member details. An open role editor retains its draft across section changes and requires review after a revision changes. These presentation changes do not establish operation permissions or add Organization APIs. The source audit and roadmap are in [the workspace UX plan](../plans/workspaces-ui-ux-improvement.md).

## Verification limits

Automated MSW/Vitest checks prove client behavior against synthetic boundary responses, not live Gateway authorization, cookie issuance, notification delivery, or database concurrency. For isolated visual review, run `node src/test/fixtures/organizationBrowserReviewServer.mjs` from the repository root and open the printed loopback URL. The test-only entry supports `?screen=workspace`, `?screen=join`, or workspace selection by default; it displays an explicit fictional-data banner and is not imported by production. Its synthetic middleware does not forward API operations to the real Gateway. Never point the test entry at an operator workspace. Stop the review server when finished.

Computer Use browser verification was attempted on 6 November 2026. The browser host was unavailable, the incognito window was minimized, and the native fallback then stopped because the current URL could not be verified for policy enforcement. No screenshots or responsive/visual results were obtained. Keyboard and modal semantics are covered by RTL; visual focus, overflow, zoom, reduced motion, and theme rendering still require a browser pass. A read-only local Gateway discovery request without credentials returned 401 with `Cache-Control: no-store`. Authenticated Gateway/email/ownership/audit smoke journeys were not executed.

Authentication remains memory-only. Public refresh and server logout contracts are absent, so reload requires sign-in and local sign-out does not prove server revocation. No complete capability endpoint, OpenAPI generation, Zustand, dependency upgrade, or additional product workflow is introduced.
