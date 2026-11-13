import { useSearchParams } from "react-router";
import { useSearchParamState } from "@/lib/useSearchParamState";
import type { ProjectListItem } from "@/features/projects/api/types";
export function useProjectFilters(projects: readonly ProjectListItem[]) {
  const [, setParams] = useSearchParams();
  const [search, setSearch] = useSearchParamState("q");
  const [statusParam, setStatus] = useSearchParamState("status", "all");
  const [kindParam, setKind] = useSearchParamState("kind", "all");
  const status = ["Draft", "Active"].includes(statusParam)
    ? statusParam
    : "all";
  const kind = ["Client", "Internal"].includes(kindParam) ? kindParam : "all";
  const query = search.trim().toLocaleLowerCase();
  const rows = projects.filter(
    (project) =>
      (status === "all" || project.status === status) &&
      (kind === "all" || project.kind === kind) &&
      project.name.toLocaleLowerCase().includes(query),
  );
  function clearFilters() {
    setParams((current) => {
      const next = new URLSearchParams(current);
      for (const key of ["q", "status", "kind"]) next.delete(key);
      return next;
    });
  }
  return {
    search,
    status,
    kind,
    rows,
    filtered: Boolean(query) || status !== "all" || kind !== "all",
    setSearch,
    setStatus,
    setKind,
    clearFilters,
  };
}
