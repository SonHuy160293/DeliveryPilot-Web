import { render } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { AppRoutes } from "@/app/router";
import { QueryProvider } from "@/app/providers/QueryProvider";
import { SessionCacheObserver } from "@/features/auth/model/SessionCacheObserver";

export function renderRoute(path: string) {
  return render(
    <QueryProvider>
      <SessionCacheObserver />
      <MemoryRouter initialEntries={[path]}>
        <AppRoutes />
      </MemoryRouter>
    </QueryProvider>,
  );
}
