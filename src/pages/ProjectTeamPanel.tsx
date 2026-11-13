import { useInfiniteQuery } from "@tanstack/react-query";
import { membersOptions } from "@/features/workspaces/api/queries";
import { isForbidden, useDeniedCleanup } from "@/lib/query/useDeniedCleanup";
import { ProjectTeamTab } from "@/features/projects/team/ProjectTeamTab";
import { AddParticipantDialog } from "@/features/projects/team/AddParticipantDialog";
import type { ProjectTeamProps } from "@/features/projects/team/types";
/** The page composes the two feature boundaries; projects owns no workspace transport. */
export function ProjectTeamPanel(props: ProjectTeamProps) {
  const options = membersOptions(props.scope);
  const {
    data,
    error,
    isPending,
    isFetching,
    hasNextPage,
    refetch,
    fetchNextPage,
  } = useInfiniteQuery({
    ...options,
    enabled: props.project.permissions.manageParticipants,
  });
  useDeniedCleanup(error, options.queryKey);
  return (
    <ProjectTeamTab
      {...props}
      addParticipant={(actions, activeUserIds) => (
        <AddParticipantDialog
          allowAdministrator={props.project.permissions.manageAdministrators}
          activeUserIds={activeUserIds}
          actions={actions}
          members={{
            items: error
              ? []
              : (data?.pages
                  .flatMap((page) => page.items)
                  .filter((member) => member.status === "active")
                  .map(({ userId, displayName, primaryEmail }) => ({
                    userId,
                    displayName,
                    primaryEmail,
                  })) ?? []),
            loading: isPending,
            denied: isForbidden(error),
            error,
            more: hasNextPage,
            fetching: isFetching,
            retry: () => {
              void refetch();
            },
            loadMore: () => {
              void fetchNextPage({ cancelRefetch: false });
            },
          }}
        />
      )}
    />
  );
}
