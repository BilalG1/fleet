import { useQueryClient } from "@tanstack/react-query";
import type { HttpMethod, PathsWithMethod } from "openapi-typescript-helpers";
import type { paths } from "@/generated/openapi";
import type { MaybeOptionalInit } from "openapi-fetch";

export const useQueryHelpers = () => {
  const queryClient = useQueryClient();

  const setQueryData = <
    Method extends HttpMethod,
    Path extends PathsWithMethod<paths, Method>,
    Init extends MaybeOptionalInit<paths[Path], Method>,
    Data = any
  >(
    method: Method,
    path: Path,
    init: Init,
    updater: (oldData: Data | undefined) => Data | undefined
  ) => {
    const queryKey = init === undefined ? [method, path] as const : [method, path, init] as const;
    queryClient.setQueryData<Data>(queryKey, updater);
  };

  const invalidateQueries = <
    Method extends HttpMethod,
    Path extends PathsWithMethod<paths, Method>,
    Init extends MaybeOptionalInit<paths[Path], Method>,
  >(
    method: Method,
    path: Path,
    init?: Init,
  ) => {
    const queryKey = init === undefined ? [method, path] as const : [method, path, init] as const;
    queryClient.invalidateQueries({ queryKey });
  };

  return {
    setQueryData,
    invalidateQueries,
  };
};