# 02 — Sitemap, routes and user flows

## 1. Sitemap

Solid boxes are approved routes in `src/lib/routes.ts`. Dashed boxes are routes approved on 11 Nov 2026 (T0-01) that are not yet in `routes.ts`; task T0-03 adds them.

```mermaid
flowchart TD
  subgraph Public["PublicLayout"]
    home["/ Home (01)"]
    signIn["/sign-in (02)"]
    signUp["/sign-up (03)"]
    join["/join-workspace (06)"]
    joinP["/join-project (17)"]:::proposed
    nf["* Not found (07)"]
  end
  subgraph App["AppLayout (signed in)"]
    ws["/workspaces (04)"]
    subgraph W["/w/:workspaceSlug (05)"]
      ov["?section=overview"]
      mem["?section=members"]
      rol["?section=roles"]
      inv["?section=invitations"]
      own["?section=ownership"]
      aud["?section=audit"]
      links["?section=client-links (10)"]:::proposed
      rec["?section=projects-recovery (16)"]:::proposed
    end
    engL["/w/:workspaceSlug/engagements (08)"]:::proposed
    engD["/w/:workspaceSlug/engagements/:engagementId (09)"]:::proposed
    prjL["/w/:workspaceSlug/projects (11)"]:::proposed
    subgraph PD["/w/:workspaceSlug/projects/:projectId"]
      pOv["?tab=overview (12)"]:::proposed
      pTeam["?tab=team (13)"]:::proposed
      pStk["?tab=stakeholders (14)"]:::proposed
      pSet["?tab=settings (15)"]:::proposed
      pShare["?tab=sharing (18)"]:::proposed
    end
  end
  subgraph Portal["PortalLayout (signed in, guest)"]
    pHome["/portal (19a)"]:::proposed
    pProj["/portal/projects/:projectId (19b)"]:::proposed
  end
  home --> signIn --> ws
  home --> signUp --> signIn
  ws --> W
  W --> engL --> engD
  W --> prjL --> PD
  engD -. "linked project" .-> PD
  join --> ws
  joinP --> pProj
  ws -. "account menu: Client portal" .-> pHome --> pProj
  classDef proposed stroke-dasharray: 5 5
```

## 2. Route table

| #         | Page                          | Route constant (proposed key)                     | Path                                               | Layout     | Status               |
| --------- | ----------------------------- | ------------------------------------------------- | -------------------------------------------------- | ---------- | -------------------- |
| 01        | Home                          | `home`                                            | `/`                                                | Public     | Approved             |
| 02        | Sign in                       | `signIn`                                          | `/sign-in`                                         | Public     | Approved             |
| 03        | Sign up                       | `signUp`                                          | `/sign-up`                                         | Public     | Approved             |
| 04        | Workspaces                    | `workspaces`                                      | `/workspaces`                                      | App        | Approved             |
| 05        | Workspace overview + sections | `workspaceOverview`                               | `/w/:workspaceSlug?section=`                       | App        | Approved             |
| 06        | Join workspace                | `joinWorkspace`                                   | `/join-workspace#…`                                | Public     | Approved             |
| 07        | Not found                     | `notFound`                                        | `*`                                                | Public     | Approved             |
| 08        | Engagements                   | `workspaceEngagements`                            | `/w/:workspaceSlug/engagements`                    | App        | Approved 11 Nov 2026 |
| 09        | Engagement detail             | `workspaceEngagement`                             | `/w/:workspaceSlug/engagements/:engagementId?tab=` | App        | Approved 11 Nov 2026 |
| 10        | Client links (client side)    | — (new `WORKSPACE_SECTIONS` value `client-links`) | `/w/:workspaceSlug?section=client-links`           | App        | Approved 11 Nov 2026 |
| 11        | Projects                      | `workspaceProjects`                               | `/w/:workspaceSlug/projects`                       | App        | Approved 11 Nov 2026 |
| 12–15, 18 | Project detail tabs           | `workspaceProject`                                | `/w/:workspaceSlug/projects/:projectId?tab=`       | App        | Approved 11 Nov 2026 |
| 16        | Project recovery              | — (section `projects-recovery`)                   | `/w/:workspaceSlug?section=projects-recovery`      | App        | Approved 11 Nov 2026 |
| 17        | Join project                  | `joinProject`                                     | `/join-project#…`                                  | Public     | Approved 11 Nov 2026 |
| 19a       | Client portal home            | `portal`                                          | `/portal`                                          | Portal [A] | Approved 11 Nov 2026 |
| 19b       | Portal project                | `portalProject`                                   | `/portal/projects/:projectId`                      | Portal [A] | Approved 11 Nov 2026 |

`:engagementId` and `:projectId` are UUIDs validated with the same regex as `isWorkspaceOverviewPath`; an invalid value renders page 07 without any request. [A] `PortalLayout` = `AppLayout` shell without workspace switcher and with a single nav item "My projects" (OQ-UI-02).

## 3. Navigation

**App sidebar (inside a workspace)** — groups from `SidebarNav.tsx`:

| Group     | Item                                          | Target              | Visible when                                                                    |
| --------- | --------------------------------------------- | ------------------- | ------------------------------------------------------------------------------- |
| Workspace | Overview                                      | `?section=overview` | always                                                                          |
| Delivery  | Projects                                      | page 11             | always (list may be empty)                                                      |
| Delivery  | Engagements                                   | page 08             | caller holds `engagements.create`, `read-all` or `manage`, or is a creator [A7] |
| Manage    | Members, Roles, Invitations, Ownership, Audit | existing sections   | unchanged rules                                                                 |
| Manage    | Client links                                  | page 10             | caller is Owner or Admin                                                        |
| Manage    | Project recovery                              | page 16             | caller is Owner                                                                 |

**Account menu** (`UserAccountMenu.tsx`): add "Client portal" → `/portal` (always shown; the portal shows an empty state when the user has no guest participation). No Backlog/Sprints/Requirements items (OQ-UI-11).

**Breadcrumbs** (`PageHeader`): `Workspaces › <Workspace name> › Projects › <Project name>`; `Workspaces › <Workspace name> › Engagements › <Client display name>`; portal: `Client portal › <Project name>`.

## 4. Key flows

### F1 — Account and workspace entry (existing)

```mermaid
flowchart LR
  A[Sign up] -->|201 created| B[Success: Sign in link]
  B --> C[Sign in]
  C -->|ok| D[/workspaces/]
  C -->|invalid| C
  D -->|no memberships| E[Empty: Create workspace]
  E --> F[Create dialog] -->|created| G[/w/:id overview/]
  D -->|Open workspace| H{Fresh membership read}
  H -->|active| G
  H -->|denied| I[No-permission state + Back to workspaces]
```

### F2 — Engagement to active client project (VS-02 vendor side)

```mermaid
flowchart TD
  A[Engagements list] -->|Create engagement| B[Create dialog: client, reference, signed date]
  B -->|201 + duplicate warning?| C[Engagement detail]
  C --> D[Contract tab: amount, currency, effort]
  C --> E[Milestones tab: add milestones]
  C --> F[Contacts tab: designate client PO]
  C -->|Create project under engagement| G[Create project dialog, engagement preselected]
  G --> H[Project overview Draft]
  H --> I[Brief + Product Goal]
  H --> J[Settings: Sprint length]
  H --> K[Team: add PM participant]
  K --> L[Invite guest: client PO email, role Viewer/BA/...]
  L -->|guest accepts F3| M[Assign client PO]
  M --> N{Readiness checklist complete?}
  N -->|yes| O[Activate project]
  N -->|only client PO missing| P[Activate with waiver reason]
  N -->|other gaps| Q[Show gap list, button disabled]
  O --> R[Project Active]
  P --> R
```

### F3 — Guest admission

```mermaid
flowchart TD
  A["Email link to /join-project (proof in URL fragment)"] --> B{Signed in?}
  B -->|no| C[Sign in, flow kept in memory] --> D
  B -->|yes| D[Preview: project name, offered role, inviter]
  D -->|email mismatch| E[Error: different email, sign out option]
  D -->|caller is workspace member| F[Error: ask to be added as participant]
  D -->|expired/used/cancelled| G[Generic: invitation no longer valid]
  D -->|Accept| H[Guest admitted] --> I[/portal/projects/:id/]
  D -->|Decline| J[Declined confirmation]
```

### F4 — Share and withdraw (vendor) → read (guest)

```mermaid
sequenceDiagram
  actor PM as Member PM
  participant UI as Sharing tab (18)
  participant Repo as SharingRepository (mock)
  actor G as Client guest
  participant Portal as Portal project (19b)
  PM->>UI: Share "Scope and exclusions"
  UI->>Repo: share(projectId, {itemType: BriefItem, briefItemCode: ScopeAndExclusions})
  Repo-->>UI: share {status: Shared, sharedAt}
  UI-->>PM: Badge "Shared", status message
  G->>Portal: open project
  Portal->>Repo: getGuestProjectView(projectId)
  Repo-->>Portal: default view + shared items
  PM->>UI: Withdraw (optional reason)
  UI->>Repo: withdraw(shareId, version, reason)
  G->>Portal: next request
  Portal-->>G: item no longer listed
```

### F5 — Client organization link (cross-workspace)

```mermaid
flowchart LR
  A[Vendor manager: Issue link code] --> B[Code shown once + Copy]
  B -->|sent outside product| C[Client Owner/Admin: Client links section]
  C --> D[Enter code] --> E{Valid?}
  E -->|no| F[Generic failure message]
  E -->|yes| G[Preview: engagement name + client display name]
  G -->|Confirm link| H[Linked list shows engagement]
  H -->|Remove link| I[Confirm dialog → removed]
```

### F6 — Orphaned project recovery

```mermaid
flowchart LR
  A[Owner: Project recovery section] --> B[List flagged projects, name only]
  B --> C[Appoint administrator dialog: pick member participant + reason]
  C -->|ok| D[Project removed from list]
  C -->|no member participant| E[Message: cannot recover, stays flagged]
```
