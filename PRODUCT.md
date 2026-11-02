# DeliveryPilot product context

<!-- impeccable:product-schema 1 -->

This design-focused summary derives from [the product blueprint](docs/product.md), which remains the product source of truth. It adds no requirements or permissions. Follow [AGENTS.md](AGENTS.md), the [UI rulebook](docs/ui/UI-RULES.md), and [frontend architecture](docs/frontend/architecture.md). Preserve existing design documentation and frozen tokens; report conflicts before changing them.

## Platform

web

## Users

Engineering Managers and Delivery Managers coordinate software delivery commitments, blockers, dependencies, and stakeholder decisions. The initial market hypothesis is software agencies and engineering delivery teams. Internal collaborators and client stakeholders have distinct information needs; job titles do not grant access.

## Product Purpose

Connect business intent and client commitments to requirements, delivery work, verification, acceptance, and releases. Help users understand agreed scope, approved versions, changes, delivery obstacles, and the evidence behind progress. Intended outcomes include clearer accountability and earlier recognition of delivery risks; these remain customer outcome hypotheses.

## Positioning

The proposed differentiation combines client collaboration, versioned requirement baselines, requirement-to-release traceability, and explainable delivery risk assistance. This positioning requires customer validation; do not present planned capabilities or predictive reliability as available functionality.

## Operating Context

Teams manage concurrent projects and external reviews while decisions, work, and test evidence can be fragmented across tools. Intended journeys connect requirements to delivery, assess proposed scope changes against historical baselines, and support human review of evidence-backed delivery concerns. Scrum, Kanban, and controlled hybrid workflows must remain possible; lifecycle capabilities are not mandatory sequential gates.

## Capabilities and Constraints

- Current frontend: marketing, sign-in/registration validation previews, fictional workspace selection and creation, and a blank feature template. Authentication, authorization, APIs, and product-data persistence are not connected.
- Planned MVP: workspace membership, projects/discovery, requirement versioning, basic configurable approvals, backlog, core delivery workflows, basic risks/issues, scoped client collaboration, and traceability. Later capabilities follow the blueprint's release boundaries.
- Say **workspace** in the UI. Users may belong to multiple workspaces; each MVP project has one owning workspace. Slugs and membership labels never establish authorization. Client access is intentionally scoped.
- Approvals apply to specific artifact versions. Work Done, QA Passed, Client Accepted, and Released are distinct. Risk, issue, blocker, and dependency are not interchangeable.
- AI assistance must respect authorization, expose evidence and uncertainty, and leave approved commitments under human control. Never claim mock writes, authentication, access grants, or unsupported AI certainty.
- Detailed contracts, approval granularity, pilot visibility, commercial assumptions, and other open hypotheses remain undecided in the blueprint. Do not infer them from this summary.

## Brand Commitments

Use DeliveryPilot's clear, accountable, calm voice: sentence case, plain English, specific actions, and modest claims. Retain `TODO(copy)` where approval is pending. Existing UI rules and tokens govern presentation; this summary establishes no visual replacement.

## Evidence on Hand

The blueprint is a working baseline, not validated customer research. The repository contains UI constraints, a runnable mock foundation, and fictional records in `src/mocks/workspaces.ts`. These are demonstration evidence, not customer proof. Do not fabricate testimonials, customers, ROI, pricing, or performance claims.

## Product Principles

1. Keep commitments, decisions, versions, and delivery evidence traceable.
2. Preserve workspace isolation and explicitly scoped collaboration.
3. Keep human decisions in control of commitments and AI assistance.
4. Show evidence and uncertainty before claiming certainty.
5. Support iterative delivery and complete approved vertical slices.

## Accessibility & Inclusion

Target WCAG 2.2 AA through semantic structure, keyboard access, visible focus, modal focus management, associated field errors, readable contrast, reduced motion, and responsive layouts. Provide ready, loading, empty, error, success, and no-permission presentations. Demo state parameters never represent production authorization or server outcomes. Do not equate a target standard or partial checks with certification.
