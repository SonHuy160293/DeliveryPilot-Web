import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/EmptyState";
import { ScreenState } from "@/components/ScreenState";
import { ApiError } from "@/lib/api/apiError";
import { fixtureWorkspaceApi } from "@/test/fixtures/workspaceApi";

/** Test composition only: validates a full flow without shipping a fictional product API/screen. */
export function WorkspaceApiHarness({
  api,
}: {
  api: ReturnType<typeof fixtureWorkspaceApi>;
}) {
  const client = useQueryClient();
  const list = useQuery(api.list());
  const create = useMutation({
    ...api.create(),
    onSuccess: async () => {
      await client.invalidateQueries({ queryKey: api.keys.lists() });
    },
  });
  return (
    <div>
      {list.isPending ? (
        <ScreenState status="loading" scope="Workspaces" />
      ) : null}
      {list.isError ? (
        <div role="alert">
          <p>
            {list.error instanceof ApiError
              ? list.error.message
              : "Could not load workspaces."}
          </p>
          <Button
            onClick={() => {
              void list.refetch();
            }}
          >
            Retry loading
          </Button>
        </div>
      ) : null}
      {list.data && !list.data.length ? (
        <EmptyState
          title="No workspaces"
          description="Create a fixture record to test the mutation."
        />
      ) : null}
      {list.data ? (
        <ul>
          {list.data.map((item) => (
            <li key={item.id}>{item.name}</li>
          ))}
        </ul>
      ) : null}
      {list.isRefetching ? <p role="status">Refreshing workspaces</p> : null}
      <Button
        disabled={create.isPending}
        onClick={() => {
          create.mutate({ name: "Test fixture", slug: "test-fixture" });
        }}
      >
        Create fixture
      </Button>
      {create.isError ? (
        <p role="alert">
          Fixture creation failed. Check the mock server before retrying.
        </p>
      ) : null}
      {create.isSuccess ? (
        <p role="status">Fixture created in the mock server only.</p>
      ) : null}
    </div>
  );
}
