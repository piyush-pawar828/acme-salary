import { useCallback, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { parseSearch, serializeSearch, type SearchState } from "./query-string";

export function useSearchState(): [SearchState, (patch: Partial<SearchState>) => void] {
  const [params, setParams] = useSearchParams();
  const state = useMemo(() => parseSearch(params), [params]);

  const update = useCallback(
    (patch: Partial<SearchState>) => {
      // Any change other than paging resets to the first page.
      const next = { ...state, ...patch, page: patch.page ?? 1 };
      setParams(serializeSearch(next));
    },
    [state, setParams],
  );

  return [state, update];
}
