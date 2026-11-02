import { QueryClientProvider } from "@tanstack/react-query";
import { render } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { AppRoutes } from "@/app/router";
import { createQueryClient } from "@/lib/query/queryClient";
import { SessionCacheObserver } from "@/features/auth/model/SessionCacheObserver";
import type { InvitationSecret } from "@/features/workspaces/recipient/invitationFlow";
import { createInvitationFlow } from "@/features/workspaces/recipient/invitationFlow";

export function renderOrganizationRoute(
  path: string,
  initialInvitation?: InvitationSecret,
) {
  const client = createQueryClient();
  client.setDefaultOptions({
    queries: { retry: false, staleTime: 60_000, refetchOnWindowFocus: false },
    mutations: { retry: false },
  });
  const result = render(
    <QueryClientProvider client={client}>
      <SessionCacheObserver />
      <MemoryRouter initialEntries={[path]}>
        <AppRoutes
          initialInvitation={
            initialInvitation
              ? createInvitationFlow(initialInvitation)
              : undefined
          }
        />
      </MemoryRouter>
    </QueryClientProvider>,
  );
  return { ...result, client };
}
