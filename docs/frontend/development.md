# Development guide

## Start and inspect

Run `npm ci` then `npm run dev` at the repository root. Read AGENTS.md, product.md, the UI rulebook, agent brief, and affected source before editing. The user's original one-time bootstrap authorization is consumed; future agents cannot reuse it for dependency or token changes.

At bootstrap the requested `.agents/skills/` directory was absent from this repository and the constraint pack. Local skill paths were also checked: react-best-practices, composition-patterns, shadcn, design-system, and impeccable were not found. Do not claim those skills were loaded or install skills without authorization.

## Add a component

Use an existing generated primitive first. Compose `Card`, `CardContent`, and `Button`; do not invent another button primitive. Give public props explicit types and use `unknown` with narrowing instead of unsafe casts. Shared components need an actual shared responsibility; single-feature UI belongs in its feature.

```tsx
import { Card, CardContent } from "@/components/ui/card";

interface GuidanceProps {
  description: string;
}

export function Guidance({ description }: GuidanceProps) {
  return (
    <Card>
      <CardContent>
        <p className="text-base text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}
```

Use semantic tokens, approved typography, and spacing steps 1, 2, 3, 4, 6, 8, 12, 16 for padding/margin/gaps. Use native headings and landmarks within compositions. Never solve feature styling by editing token CSS or generated primitives.

## Add a feature or extend BlankPage

1. Confirm the approved user goal, existing route, data contract, authorization, and acceptance criteria. New routes require approval even if added to the constant map.
2. Follow `pages/BlankPage.tsx`: breadcrumb, PageHeader, state gate, content region, and explicit TODO(feature) markers.
3. Put feature-owned interactions under `features/<feature>/`; pages coordinate. Extract a coherent form/section when the 180-line composition limit would be exceeded.
4. Use local UI state and the existing Axios/TanStack Query foundation for verified backend state. Read [api-integration.md](api-integration.md). Do not invent endpoints, auth sessions, global state, or persistence.
5. Provide appropriate real loading, empty, error, success and permission states. Remove demo query overrides when connecting authorized API data.
6. Label inputs visibly above with stable IDs. Validate on blur/submit, associate adjacent errors, and focus the first invalid field after submit. Do not invent a password policy.
7. Use Button asChild with Router Link and approved route constants. Keep keyboard navigation and target sizes usable.
8. Put fictional workspace records only in `mocks/workspaces.ts`. Follow existing en-US numbers and UTC date formatting.
9. Colocate behavior tests using roles/labels and user-event. See [testing.md](testing.md).

## Verify and review

```powershell
npm run format
npm run typecheck
npm run lint
npm run format:check
npm run test:run
npm run build
```

Prettier excludes the unmodified upstream product/UI documents and frozen CSS. The lockfile is tracked and machine-generated. Do not commit node_modules, build output, caches, environment files, or credentials.

Inspect light/dark mode, keyboard focus, dialog trapping/return, all states, 320/375/768/1024/1440px layouts, reduced motion, and 200% zoom. Report unexecuted checks honestly. Mock feedback must never imply a server write, authenticated identity, or access grant.

For missing required product decisions, contradictions, new dependencies/routes, or frozen-file changes, first check whether the current user request already authorizes the change; otherwise stop affected work and use the exact UI-ESC-01 block from the rulebook. Continue independent authorized work. Do not add a speculative abstraction to bypass a missing decision.
