# DeliveryPilot - Product Blueprint

> **Version:** 1.0 (working baseline)  
> **Status:** Product direction agreed in planning discussions; detailed requirements and customer assumptions not yet validated.  
> **Product type:** Multi-tenant B2B SaaS  
> **Primary market hypothesis:** Software outsourcing agencies and engineering delivery teams  
> **Document owner:** Product Owner  
> **Related documents:** [Requirements](requirements.md) | [Architecture](architecture.md) | [Roadmap](roadmap.md)

## 1. Product definition

**DeliveryPilot is an AI-powered Software Delivery Lifecycle Management Platform.** It connects business intent and client commitments to planning, implementation, quality verification, acceptance, release, and continuous improvement. It is not only a task tracker or AI chat interface.

**North star:** *Every software delivery commitment should be understandable, traceable, measurable, and proactively manageable.*

**Value proposition:** From business intent to verified delivery, with end-to-end traceability, configurable governance, and evidence-based delivery intelligence.

DeliveryPilot should answer:

- What problem is this project solving, and what scope was agreed?
- Which requirement version was approved, by whom, and when?
- Which features, stories, implementation work, and tests satisfy a requirement?
- What has changed since the scope or delivery-plan baseline?
- Are capacity, dependencies, risks, and quality indicators threatening delivery?
- What has been developed, tested, accepted, and released?
- What action is recommended next, and what evidence supports it?

## 2. Problem and opportunity

Software teams commonly manage discovery, sign-off, engineering work, testing, and reporting in separate systems. For outsourcing agencies this makes it difficult to reconstruct client decisions, identify scope creep, coordinate approvals, or explain delivery delays. DeliveryPilot aims to reduce this fragmentation.

The initial differentiation to validate with customers is **client collaboration + requirement/version baselines + requirement-to-release traceability + explainable delivery risk assistance**. A backlog board alone is not the differentiator.

## 3. Customers, buyers, and users

**Initial ICP hypothesis (not validated):** Software agencies with roughly 10-100 staff, multiple concurrent projects, and recurring external-client approvals.

| Persona | Main jobs to be done |
|---|---|
| Executive / CTO | See portfolio health, strategic delivery risks, and decisions needing attention |
| Delivery Manager | Coordinate commitments, escalations, and shared resources |
| Project Manager | Maintain plans, milestones, dependencies, risks, and stakeholder communication |
| Product Owner | Own goals, priorities, scope decisions, and backlog value |
| Business Analyst | Discover needs, refine requirements, clarify rules, and maintain traceability |
| Scrum Master | Facilitate Scrum and help address team impediments |
| Tech Lead / Architect | Evaluate feasibility, dependencies, system design, and technical risk |
| Developer | Receive clear work, resolve dependencies, and show implementation progress |
| QA / Tester | Verify acceptance criteria, manage defects, and record evidence |
| DevOps / SRE | Plan infrastructure, reliability, and release work |
| Client stakeholder | Review shared scope and requirements, approve authorized artifacts, give UAT feedback |

A person's job title is **not** an authorization role. Organization membership, project role, explicit permissions, and resource visibility determine access.

## 4. Organization, product, and project model

- A **tenant / organization** is the boundary for ownership, membership, configuration, and data isolation.
- One organization can own many projects; a user account may belong to multiple organizations.
- In the MVP, each project has exactly one owning tenant.
- An external **client organization** is a business relationship, not automatically a co-owner of the vendor's project data.
- Client stakeholders receive intentionally scoped project access through the Client Portal.
- A **product** is the evolving software outcome; a **project** is a bounded delivery initiative. MVP may store product vision within the project while leaving room for a separate Product entity later.
- Projects can use Scrum, Kanban, or a controlled hybrid mode. The platform must not impose a single workflow on all teams.

**Example:** Agency A owns an ERP implementation project. Client B can review designated requirements and UAT artifacts without accessing Agency A's internal estimates, confidential notes, or other projects.

## 5. Product capabilities across the lifecycle

These are capabilities, **not mandatory waterfall gates**. Discovery, refinement, engineering, acceptance, and replanning may overlap or repeat.

| Capability | Core activities | Representative outputs |
|---|---|---|
| Initiation and discovery | Problem definition, stakeholders, vision, goals, scope, MVP hypothesis, constraints | Project brief, vision, scope, assumptions |
| Requirements engineering | User/business/functional/NFRs, rules, revisions, questions, reviews | Requirement versions, rules, review decisions |
| Product and delivery backlog | Epics, features, stories, bugs, technical work, priorities, relations | Prioritized and traceable backlog |
| Technical and delivery planning | Feasibility, architecture, estimates, availability, allocations, dependencies | Decisions, plans, forecasts, milestones |
| Iterative delivery | Scrum Sprints or Kanban flow, assignments, blockers, work execution | Working increment, activity and progress evidence |
| Verification and acceptance | Tests, defects, NFR checks, client feedback, UAT, sign-off | Quality and acceptance evidence |
| Release and operations | Release readiness, deployments, incidents, feedback, changes | Release records, follow-up work, improvement actions |

**Key distinction:** A story being marked Done is not the same as QA Passed, Client Accepted, or Released.

## 6. Critical product concepts

| Concept | Meaning / boundary |
|---|---|
| Business objective | Outcome and value to be achieved |
| User requirement | A stakeholder or user's need |
| Functional requirement | Required system behavior |
| Non-functional requirement | Required quality, reliability, security, etc. |
| Business rule | Domain policy or decision rule |
| Requirement baseline | Approved, versioned reference scope |
| Change request | Controlled proposal to change a baseline or commitment |
| Epic / feature / user story | Backlog decomposition to deliver valuable capabilities |
| Technical work item | Infrastructure, security, refactoring, spike or other work not necessarily under a story |
| Estimate / capacity / forecast | Distinct concepts: expected effort, available work capacity, predicted delivery outcome |
| Risk / issue / blocker / dependency | Potential event / occurred problem / active obstruction / work relationship |
| Approval | An authorized decision on a particular artifact version |
| Release | Recorded delivery of software, distinct from iteration completion |

The canonical cross-feature constraints are in [requirements.md](requirements.md). A requirement can be satisfied by multiple backlog items and vice versa.

## 7. Core user journeys

### Journey A - Requirement to delivery

1. Agency member creates an organization and project.
2. PM/PO/BA records vision, scope, stakeholders, and MVP goal.
3. BA drafts and reviews a versioned requirement.
4. An authorized internal or client stakeholder approves the exact version if policy requires it.
5. PO/BA links the requirement to a feature and user story.
6. The team refines, estimates, plans, implements, and tests the work.
7. The project shows requirement-to-work-to-test/release traceability and an audit trail.

### Journey B - Client scope change

1. Client requests a change to an approved requirement.
2. New proposed version remains separate from the approved baseline.
3. Team assesses dependent features, effort, timeline, risk, and cost if applicable.
4. Authorized decision-makers approve, reject, or defer the change.
5. Backlog and plans are reconciled; historical baselines remain accessible.

### Journey C - Proactive delivery intervention

1. Dependencies, blocked work, planned effort, availability, and milestones generate delivery signals.
2. Rules detect objective concerns before optional AI explanation.
3. A finding records evidence and affected artifacts.
4. PM reviews suggested options; no automatic commitment change occurs.
5. The team records action and outcome for later improvement.

## 8. MVP and release strategy

**MVP goal:** An agency can complete Journey A with a real external collaborator using a secure, auditable workspace. It must also be able to manage an iteration and register a blocker. Detailed MVP acceptance gates are in [roadmap.md](roadmap.md).

**MVP:** Organization/membership; project and discovery; requirements and versioning; configurable basic approval; backlog; core Scrum/Kanban delivery; basic risks/issues; scoped Client Portal; traceability.

**Next release:** Capacity, estimation, QA/UAT/release workflows, change requests, forecasting, rule-based blocker detection and AI drafting assistance.

**Later:** Cross-project resource and portfolio analysis, richer integrations, probabilistic predictions, enterprise governance, and validated commercial features.

**MVP non-goals:** Billing, complex multi-owner cross-tenant collaboration, enterprise-grade custom workflow builders, advanced predictive AI, and automated employee scoring.

## 9. AI product principles

- Prefer explainable rules for objective conditions such as over-capacity or overdue approvals.
- Use AI for interpretation, drafting, alternative scenarios, and context-aware recommendations.
- Every actionable finding should link to authorized evidence and indicate uncertainty.
- Human approvers retain control over baselines, assignments, client communications, and delivery commitments.
- Apply tenant and user authorization before retrieving any content for an AI analysis.
- Do not claim statistically reliable forecasts without enough representative history and evaluation.
- Do not use workload signals as automated judgments of employee worth or performance.

See [architecture.md](architecture.md) for technical guardrails.

## 10. Success criteria and measures

**Customer outcome hypotheses:** Shorter approval turnaround; fewer unnoticed scope changes; improved ability to explain delivery status and impacts; earlier detection of material delivery risks.

Candidate product measures:

- Adoption: activated organizations, active projects, pilot-to-paid conversion.
- Requirements: approval lead time, rework rate, approved-version traceability coverage.
- Delivery: milestone predictability, blocked work age, cycle time, throughput, forecast error.
- Quality: defect escape rate, UAT pass rate, reopened work.
- AI: finding precision, false positive rate, time-to-detection, accepted recommendations, cost per analysis.

Define precise measurement methods before treating these as performance targets. Metrics must not be used to rank individuals by story points or hours.

## 11. Product principles

1. **Business value first.** Validate problems before replicating competitor features.
2. **Trace critical commitments.** Keep the why, decision, version, and resulting delivery evidence connected.
3. **Support Agile; do not force Waterfall.** Lifecycle capabilities can run concurrently or iteratively.
4. **Human decision, AI assistance.** No autonomous modifications to approved commitments.
5. **Security by design.** Tenant isolation and scoped client access are foundational.
6. **Evidence before certainty.** Expose source evidence and forecast assumptions.
7. **Ship vertical slices.** Favor complete business journeys over isolated technical modules.
8. **Design for evolution.** Clear boundaries without premature distributed complexity.

## 12. Open product hypotheses

These decisions require customer evidence and/or formal acceptance:

- Actual initial ICP, buyer, purchasing process and willingness to pay.
- Whether clients expect per-requirement, per-package, or milestone-based sign-off.
- The minimum client-facing visibility necessary for a pilot.
- Initial Product/Project distinction and client engagement/contract needs.
- Billing, data residency, regulatory constraints, and integrations.
- MVP delivery team, infrastructure budget, and target dates.

**Change discipline:** Update this file when the *product direction or business rationale* changes. Put detailed behavior and business invariants in [requirements.md](requirements.md), system trade-offs in [architecture.md](architecture.md), and planned sequencing in [roadmap.md](roadmap.md).
