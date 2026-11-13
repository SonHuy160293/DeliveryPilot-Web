import type {
  BriefItemCode,
  ProjectBrief,
} from "@/features/projects/api/types";
export const BRIEF_ITEMS = [
  { code: "Problem", field: "problem", label: "Problem" },
  {
    code: "ObjectivesAndSuccessCriteria",
    field: "objectivesAndSuccessCriteria",
    label: "Objectives and success criteria",
  },
  {
    code: "ScopeAndExclusions",
    field: "scopeAndExclusions",
    label: "Scope and exclusions",
  },
  { code: "Assumptions", field: "assumptions", label: "Assumptions" },
  {
    code: "ConstraintsAndDependencies",
    field: "constraintsAndDependencies",
    label: "Constraints and dependencies",
  },
  { code: "OpenQuestions", field: "openQuestions", label: "Open questions" },
] as const satisfies readonly {
  code: BriefItemCode;
  field: keyof ProjectBrief;
  label: string;
}[];
export const isBriefWritten = (value: string | null) => Boolean(value?.trim());
