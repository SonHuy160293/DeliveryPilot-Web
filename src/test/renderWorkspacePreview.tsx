import { renderRoute } from "@/test/renderRoute";

/** Legacy helper name. Renders connected routes and requires an explicit test session. */
export function renderWorkspacePreview(path: string) {
  return renderRoute(path);
}
