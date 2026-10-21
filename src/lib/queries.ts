import { queryOptions } from "@tanstack/react-query";
import { getCatalog, getSettings } from "./store.functions";

export const catalogQueryOptions = queryOptions({
  queryKey: ["catalog"],
  queryFn: () => getCatalog(),
});

export const settingsQueryOptions = queryOptions({
  queryKey: ["settings"],
  queryFn: () => getSettings(),
  staleTime: 5 * 60 * 1000,
});
