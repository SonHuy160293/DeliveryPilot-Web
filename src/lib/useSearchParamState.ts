import { useCallback } from "react";
import { useSearchParams } from "react-router";

export function useSearchParamState(key: string, defaultValue = "") {
  const [params, setParams] = useSearchParams();
  const value = params.get(key) ?? defaultValue;
  const setValue = useCallback(
    (next: string) => {
      setParams((current) => {
        const updated = new URLSearchParams(current);
        if (next === defaultValue) updated.delete(key);
        else updated.set(key, next);
        return updated;
      });
    },
    [key, defaultValue, setParams],
  );
  return [value, setValue] as const;
}
