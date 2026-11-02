# DeliveryPilot — Product and UX analysis

> Source: `product.md` v1.0 (working baseline). This analysis proposes UX decisions; it does not replace validated requirements.

## Primary user: Delivery Manager / Engineering Manager

**Top jobs to be done:** (1) assess project delivery health, blockers and commitments; (2) trace approved scope to work, tests and release evidence; (3) coordinate stakeholder decisions and escalation.

**Top pains:** (1) fragmented decisions, backlog and test evidence; (2) unclear scope changes and sign-off history; (3) dependencies and approval delays noticed too late.

**Success moment:** In one view, the manager can identify a material risk, inspect its evidence and affected commitment, then decide the next accountable human action.

## Secondary users and distinct information needs

| Persona | Needs to see | Security boundary |
|---|---|---|
| Engineering Director / CTO | Portfolio health, critical risks, escalations | Portfolio data only when explicitly granted |
| Project Manager | Milestones, dependencies, blockers, approvals | Assigned/authorized project scope |
| Product Owner | Outcomes, priority, approved scope, backlog | Resource-level grants |
| Business Analyst | Requirement versions, open questions, trace links | Assigned project artifacts |
| Tech Lead / Architect | Feasibility, design choices, technical risk | Authorized engineering context |
| Developer | Assigned work, criteria, dependencies | Accessible work and references |
| QA / Tester | Criteria, defects, test and acceptance evidence | Authorized verification artifacts |
| Scrum Master | Workflow, iteration progress, impediments | Authorized team/project scope |
| DevOps / SRE | Release readiness, deployment, operational risks | Authorized operations context |
| Client stakeholder | Shared scope, approval requests, UAT feedback | Explicit client-facing artifact permissions only |

A job title is NEVER an authorization role. Workspace membership and scoped grants govern access.

## UX tendencies

| Axis | Choice | Persona rationale |
|---|---|---|
| Density | Moderately data-dense | Managers compare several signals at once |
| Temperament | Calm | Risk and approval decisions need concentration |
| Personality | Trust-first | Decisions have contractual and delivery impact |
| Navigation | Guided | Clear information architecture reduces searching |
| Workflow | Flexible | Scrum, Kanban and hybrid must coexist |
| Notifications | Signal-first | Show verified exceptions, not speculative alarm |

## Brand voice

- **Clear.** Do: “3 requirements need review.” Don't: “Lots of exciting things happening!”
- **Accountable.** Do: “Approved version 2 by the project owner.” Don't: “Everything is approved!”
- **Calm.** Do: “This dependency may affect the milestone.” Don't: “Your project is in crisis!”

UI vocabulary: **workspace** (not tenant/organization) to name the UI boundary. Product and project remain distinct. A completed story is not the same as a passed test, accepted change, or release. AI advice remains optional, explainable and subject to a human decision.
