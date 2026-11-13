import { useInfiniteQuery } from "@tanstack/react-query";
import type { Ref } from "react";
import {
  rolesOptions,
  resourceKey,
  type ScopedOwner,
} from "@/features/workspaces/api/queries";
import { ChoiceList } from "@/features/workspaces/components/ChoiceList";
import { ReadState, LoadMore } from "@/components/ReadState";

export function RolePicker({
  scope,
  selected,
  onChange,
  error,
  onBlur,
  firstRef,
}: {
  scope: ScopedOwner;
  selected: string[];
  onChange: (selected: string[]) => void;
  error?: string;
  onBlur?: () => void;
  firstRef?: Ref<HTMLButtonElement>;
}) {
  const query = useInfiniteQuery(rolesOptions(scope));
  const roles =
    query.data?.pages
      .flatMap((page) => page.items)
      .filter((role) => !role.retiredAt && role.code !== "owner") ?? [];
  return (
    <ReadState
      query={query}
      queryKey={resourceKey(scope, "roles")}
      scope="Available roles"
    >
      <ChoiceList
        label="Offered roles"
        options={roles.map((role) => ({ id: role.id, name: role.name }))}
        selected={selected}
        onChange={onChange}
        error={error}
        onBlur={onBlur}
        firstRef={firstRef}
      />
      {!roles.length ? (
        <p className="text-sm">
          No eligible role definitions are available in the loaded pages.
        </p>
      ) : null}
      <LoadMore
        more={query.hasNextPage}
        pending={query.isFetching}
        load={query.fetchNextPage}
      />
    </ReadState>
  );
}
