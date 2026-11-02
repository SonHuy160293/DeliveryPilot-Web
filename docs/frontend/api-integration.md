# API integration guide

This guide separates transport, server state, and UI concerns for a .NET developer working in React. The foundation is active. Sign-in now connects to Identity; registration connects to Identity without establishing a session. See [authentication.md](authentication.md) for the current session behavior and limitations.

## Request flow and ownership

`main.tsx` → `QueryProvider` → feature `queryOptions` / `mutationOptions` → feature API function → shared Axios client → configured gateway/service. Responses return through safe error normalization and feature-owned runtime contract validation. TanStack Query owns the response cache and request lifecycle; components render its state.

| Layer               | Responsibility                                                                          | Location                                                |
| ------------------- | --------------------------------------------------------------------------------------- | ------------------------------------------------------- |
| Transport           | URL boundary, JSON, timeout, AbortSignal, optional bearer supplier, normalized failures | `src/lib/api/`                                          |
| Server state        | One stable QueryClient per mounted app, caching and safe retry defaults                 | `src/app/providers/QueryProvider.tsx`, `src/lib/query/` |
| Domain              | Endpoint path, DTO validation, keys, queries, mutations                                 | `src/features/<feature>/api/`                           |
| UI                  | Loading, data, empty, retry and pending actions                                         | Feature components using Query hooks                    |
| Contract generation | Future compiler of a verified OpenAPI contract                                          | Not configured; see activation prerequisites below      |

Axios is comparable to a configured HttpClient. TanStack Query manages the asynchronous server-state lifecycle around requests, rather than replacing HttpClient. Orval would generate contract-specific TypeScript and calls from OpenAPI; it would not replace transport security or authorization. There is no generic repository/DI container, duplicate cache in Zustand, or fetch-in-useEffect pattern.

Installed: Axios 1, TanStack Query 5, and MSW 3 for tests. Devtools are omitted until connected screens make them useful; no development tool ships in the bundle. React Hook Form and Zod support the connected sign-in form; Zustand remains uninstalled.

## Verified backend authority

Read-only audit of the adjacent `DeliveryPilot` backend found these implemented sources (paths relative to that backend):

- `src/Gateway/DeliveryPilot.Gateway/proxy.json`: YARP routes `/identity/api/v1/auth/register` and `/identity/api/v1/auth/login`, removing `/identity` upstream.
- `src/Modules/DeliveryPilot.Identity/DeliveryPilot.Identity.API/Controllers/AuthController.cs`: public registration/login actions. Registration returns HTTP 201 on success.
- `src/Modules/DeliveryPilot.Identity/DeliveryPilot.Identity.API/Contracts/Auth/RegisterUserRequest.cs`: nullable `DisplayName`, `Email`, `Password`; unknown request members disallowed.
- `src/Modules/DeliveryPilot.Identity/DeliveryPilot.Identity.Application/Features/Auth/Commands/RegisterUser/RegisterUserResponse.cs`: `UserId` GUID response.
- `src/BuildingBlocks/DeliveryPilot.SharedKernel/Abstractions/Shared/ApiResponse.cs` and `ApiErrorResponse.cs`: `{ success, data, error }` envelope; error contains code, message, optional errors and traceId.
- The backend `ApiResponseEnvelopeFilter` and `CorrelationIdMiddleware` implement wrapping and response `X-Correlation-Id`.

Check exact paths against your backend checkout when moving either repository. ASP.NET's default camelCase JSON is used. `registerUser` accepts the verified three-field DTO, unwraps the envelope, validates the returned GUID, and returns `{ userId }`. It does not sign in. The registration form calls this adapter imperatively, with cancellation and no automatic retries. Credentials never enter Query mutation variables or caches.

No verified Gateway OpenAPI JSON/YAML artifact or Projects CRUD contract is supplied. Organization integration now implements the separately verified 30-operation Markdown contract; see [Organization integration](organization-integration.md). Do not treat service-key-protected internal endpoints as browser APIs or expose service keys in Vite configuration.

## Configuration and local access

No env file is required to run the existing UI. Copy `.env.example` to `.env.local` when integrating a backend. Restart Vite after changes. `VITE_` values are compiled into public code; they must contain no secrets.

- `VITE_API_BASE_URL`: API root; omitted means API calls fail with a configuration error. HTTP(S), relative same-origin roots, and trailing slashes are supported. Credentials, query strings and fragments in the base are rejected.
- `VITE_API_TIMEOUT_MS`: default 15000; integer 100–120000 milliseconds.
- All feature endpoints are relative **without a leading slash**. The registration endpoint is `api/v1/auth/register`.

Choose one topology:

| Topology                       | API base                                      | Development proxy                                                                  |
| ------------------------------ | --------------------------------------------- | ---------------------------------------------------------------------------------- |
| Same-origin production YARP    | `/identity/`                                  | Not used; host routes this prefix to YARP                                          |
| Local Vite → YARP              | `/identity/`                                  | Set `DEV_API_PROXY_TARGET` to your actual gateway origin; leave strip-prefix false |
| Local Vite → Identity directly | `/identity/`                                  | Set target to the actual Identity origin and `DEV_API_PROXY_STRIP_PREFIX=true`     |
| Browser → Identity directly    | Actual absolute Identity origin ending in `/` | None; backend must allow the frontend origin via CORS                              |

`DEV_API_PROXY_PREFIX` defaults to `/identity`, without a trailing slash. Proxy options are server-only and do not configure production hosting. Use the URLs printed by your running backend rather than copying invented port numbers. TLS verification stays enabled; trust your local ASP.NET development certificate. Vite's proxy changes Origin/Host for development; it does not implement backend authorization. Production needs its own gateway/routing and SPA fallback.

## Authentication and error safety

The backend login returns a bearer access token and sets a secure HttpOnly refresh cookie. The frontend stores the access token in memory and enables cookie credentials only for the verified login POST. No browser refresh or logout endpoint exists. The shared API client rejects credential/base overrides, strips ad hoc Authorization headers, and blocks redirects. See [authentication.md](authentication.md) for the security model and missing CSRF/session contracts.

`AuthIntegration.getAccessToken()` reads the in-memory session after destination validation. It does not read storage, refresh or retry 401. A 401 clears only the session generation that sent the bearer token; 403 remains distinct. Configuring a URL alone never signs a user in.

`ApiError` distinguishes configuration, protocol, application-envelope failure, bad request, unauthenticated, forbidden, not found, conflict, validation, rate limit, server, network, timeout and cancellation. It preserves status, method, bounded code/trace ID, Retry-After and bounded validation fields; it discards raw Axios config/request/response/cause. User-facing general messages are local safe copy, not server `detail`, `title`, or stack traces. Treat field errors as untrusted text and map only known fields; never render HTML or log registration variables. Do not put secrets into error messages or telemetry. Cancellation is lifecycle control, not a failure toast. Real 204 responses resolve with undefined data.

Server correlation IDs are retained on failures without inventing a required outbound ID. Cross-origin backends must expose `X-Correlation-Id` and `Retry-After` for browser diagnostics. No workspace header is sent: the server must authorize every resource using its actual contract. Cache keys never grant access.

## Adding an endpoint and query

First obtain the endpoint, method, runtime JSON shape, error envelope and authorization contract. Keep domain types and runtime narrowing in the owning feature. Request `unknown` at the external boundary, then decode it as registration does; Axios generic arguments alone do not validate JSON. Never copy the test fixture's endpoints into production.

A reusable key includes **account, workspace, resource and all response-shaping parameters**. For an approved feature, build on the shared scope helper:

```ts
const root = [...workspaceScopeKey(scope), "approved-resource"] as const;
const keys = {
  lists: () => [...root, "list"] as const,
  list: (params: { search: string; page: number; sort: string }) =>
    [...root, "list", params] as const,
  detail: (id: string) => [...root, "detail", id] as const,
};
const listOptions = queryOptions({
  queryKey: keys.list(params),
  queryFn: ({ signal }) => verifiedFeatureApi.list(params, signal),
});
```

This is a pattern, not a new backend resource. `verifiedFeatureApi.list` is supplied by that feature after contract approval. Consume the signal in `httpClient.get(relativePath, { signal, params })`. Components use `useQuery(listOptions)`. Use `skipToken` instead of a query function when identity/scope/dependent input is absent; `enabled` can gate an existing definition. Disabled queries can be pending with `fetchStatus: "idle"`, so do not show a spinner merely because `isPending` is true before prerequisites exist.

Defaults: stale for 60 seconds, unused cache collected after 5 minutes, no focus/reconnect refetch, no persistence. GET/HEAD network, timeout, 5xx and 429 failures get at most two retries. Delay is bounded exponential backoff or server Retry-After up to 30 seconds. Longer server guidance disables automatic retries; UI should explain waiting before manual retry. Unknown errors, cancellation, protocol/validation errors, 401/403, and unsafe methods are not retried. Axios itself performs no retry.

## Mutations, invalidation and UI

Feature mutation functions perform one approved operation. Use `useMutation` with feature-owned `mutationOptions` for ordinary product writes; defaults set retry false. Login, registration and proof-bearing recipient calls are imperative so secrets stay outside Query caches. Disable the submit action while pending. Mutations are not assumed idempotent; after a timeout check the server before repeating a critical write. Backend idempotency/concurrency contracts remain necessary for stronger guarantees.

After success, await targeted invalidation:

```tsx
const client = useQueryClient();
const create = useMutation({
  ...approvedCreateOptions,
  onSuccess: async () => {
    await client.invalidateQueries({ queryKey: keys.lists() });
  },
});
```

Invalidate/update a detail key only when that operation changes it. Do not invalidate every workspace or the entire cache. Optimistic updates are omitted because no verified CRUD/concurrency contract justifies them. Successful registration is not evidence of a session or workspace membership.

Use established `ScreenState`, `EmptyState`, and Button compositions where appropriate. Initial authorized fetch: accessible status/skeleton. Empty array: useful empty state. Initial failure: safe inline alert plus explicit retry. Background fetch: retain current data and announce updating. Background failure: keep last data visible and show a nonblocking error with retry. Mutation: disabled pending action, adjacent safe error, verified success only. The test harness demonstrates these states without adding a product route. Forms should associate known field errors with inputs. Do not use preview query parameters for connected states.

## Scope transitions and cleanup

The scope helper requires explicit accountId/workspaceId. Connected workspace identity comes from the authenticated session and validated organization UUID, with fresh own-membership admission before dependent observers mount. Mock labels and slugs never grant access. Different keys prevent cross-scope cache display; do not use previous-data placeholders across security boundaries.

Before changing account/logout, unmount or disable session-scoped observers and call `await clearSessionCache(client)`. It cancels queries and clears query/mutation caches. Workspace transitions cancel/remove old scoped queries and remove matching scoped mutation entries with `clearWorkspaceCache`, then admit the next scope. Owned write AbortControllers and retired-session/scope checks prevent late publication; cache removal cannot undo a server commit. Routine page renders reuse the stable QueryProvider.

Query cancellation cannot undo server writes or automatically cancel running mutations. The future session owner must block/settle pending writes or own an AbortController and ignore callbacks from a retired session; do not switch identities while old mutation callbacks can run. Local sign-out uses these helpers, but server-side revocation is not yet available. Only the theme preference currently persists.

## Test fixture and commands

`src/test/fixtures/workspaceApi.ts` and `WorkspaceApiHarness.tsx` are test-only. They use existing fictional workspace records, MSW and local synthetic paths to exercise list/detail/create, filter/sort keys, loading/empty/error/retry, background fetch, targeted invalidation, cancellation and account/workspace isolation. They are not imported by production pages or exported as a backend contract.

Every query test creates and clears its own QueryClient. `src/test/mocks/server.ts` supplies the MSW Node server; setup rejects unhandled network frames and resets handlers after each test. No browser worker or backend credentials are needed. HTTP tests assert the real Fetch boundary as MSW's reconstructed frame does not preserve credential metadata.

```powershell
npm ci
npm run test:run -- src/lib/api/httpClient.test.ts
npm run test:run -- src/lib/query/queryIntegration.test.tsx
npm run test:run -- src/features/auth/api/registrationApi.test.ts
npm run typecheck
npm run lint
npm run format:check
npm run test:run
npm run build
npm run dev
```

## Activating Orval later

No Orval dependency, empty generated directory or nonfunctional `api:generate` script was added. Swagger runtime registration in backend source is insufficient without an accessible, validated specification. Activation requires:

1. A versioned local OpenAPI JSON/YAML or reachable approved schema URL describing browser-facing routes, security, envelope/ProblemDetails, nullable fields and operation IDs.
2. An agreed gateway path strategy (generated service paths versus gateway prefixes) and browser session/authorization contract.
3. Install a compatible stable Orval development dependency, pin via npm lockfile, and configure module-specific output separately under `src/api/generated/`.
4. Implement its documented custom Axios mutator using the shared client, relative paths, normalized errors and AbortSignal. Validate the envelope contract rather than generating misleading unwrapped DTOs.
5. Add `api:generate`, generate clients/hooks, replace the corresponding handwritten DTO/service, and keep component query contracts stable. Do not maintain competing manual hooks/types for the same endpoint.
6. Proposed repository policy when activated: commit generated output for review; CI regenerates from the pinned schema and fails on diff, then type-checks/tests. Generated files carry a do-not-edit header; manual fixes belong in source specs/mutator.

Until those prerequisites exist, handwritten feature-owned adapters for verified Identity and Organization contracts remain authoritative. Generation was deliberately not run. Current results are recorded in [verification.md](verification.md#11-organization-integration--6-november-2026).

## Troubleshooting

| Symptom                            | Check                                                                                                                                      |
| ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| Configuration error before request | Set API base; verify timeout bounds, relative endpoint and base path; restart Vite                                                         |
| Network / CORS                     | Browser Network/Console, backend running, trusted TLS certificate, origin allowlist and preflight; a proxy only solves development routing |
| 401                                | Actual bearer/session expiry and scheme; no automatic refresh exists; do not retry in a loop                                               |
| 403                                | Server grants and account/workspace membership; changing a frontend header/key does not grant access                                       |
| 404                                | Gateway `/identity` prefix versus direct service root, version and route; check dev strip-prefix                                           |
| 400 / 422                          | Verified payload/nullability and known field errors; registration disallows extra fields                                                   |
| 409                                | Reload and resolve the actual conflict; do not blindly replay a mutation                                                                   |
| 429                                | Respect Retry-After; long guidance requires explicit delayed recovery                                                                      |
| 500 / 503                          | Give support the safe trace ID; inspect backend logs securely; never surface raw SQL/stack traces                                          |
| Protocol error                     | HTML returned by SPA fallback, malformed JSON, missing envelope, or mismatched DTO; verify gateway target/schema                           |
| Timeout during write               | Outcome may be unknown; confirm server state/idempotency before repeating                                                                  |
| Stale/wrong-scope data             | Verify key identity and all params; disable old observers and run cleanup before transitions                                               |

Unit/integration tests use mocked network boundaries. They do not prove a live deployment's CORS, gateway connectivity, cookie/session security, or authorization. Those require the real configured backend and approved end-to-end session flow.

## Historical API foundation verification — 2 November 2026

- Dependency installation completed; `npm ls --depth=0` passes with Axios 1.21.0, TanStack Query 5.105.1 and MSW 3.0.3.
- `npm run typecheck`, `npm run lint`, `npm run format:check`, `npm run test:run` and `npm run build` pass. The complete suite has 108 tests across 8 files, including the pre-existing UI tests. Lint includes frozen-token and UI-source checks.
- `npm run dev` starts successfully. Browser smoke checks render `/`, `/sign-in`, `/sign-up`, `/workspaces`, `/w/northstar-delivery` and the unknown-route fallback with no browser warnings/errors. No UI/theme redesign was performed in this API task.
- `node .cache/api-proxy-smoke.mjs` verified both proxy prefix modes against an ephemeral local HTTP stub. This ignored review artifact proves forwarding behavior, not live YARP/Identity connectivity.
- `npm audit --omit=dev`: zero vulnerabilities. Full audit still reports 13 moderate findings in the existing ESLint/minimatch development dependency chain; no forced toolchain upgrade was made.
- API generation is not configured or run because no usable OpenAPI artifact was available. Backend connectivity, CORS, session/refresh/CSRF behavior and real authorization remain unverified against a live deployment.

Official extension references: [TanStack Query cancellation](https://tanstack.com/query/latest/docs/framework/react/guides/query-cancellation), [query retry behavior](https://tanstack.com/query/latest/docs/framework/react/guides/query-retries), [Axios request configuration](https://axios-http.com/docs/req_config), [MSW Node integration](https://mswjs.io/guides/integrations/node). Installed package types govern version-specific APIs: MSW 3 uses `onUnhandledFrame`, and this TanStack version uses `queryClient.query` for imperative query execution.
