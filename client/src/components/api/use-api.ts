import createFetchClient from "openapi-fetch"
import createClient from "openapi-react-query";
import type { paths } from "@/generated/openapi";
import { useQueryClient } from "@tanstack/react-query";
import type { HttpMethod, PathsWithMethod } from "openapi-typescript-helpers";
import type { MethodResponse } from "openapi-react-query";
import type { MaybeOptionalInit, Middleware } from "openapi-fetch";
import { useUser } from "@stackframe/react";
import { parseSSEStreamHelper } from "@/lib/stream";



export const useApi = () => {
  const queryClient = useQueryClient();
  const user = useUser({ or: "redirect" });

  const authMiddleware: Middleware = {
    async onRequest({ request }) {
      const authJson = await user.getAuthJson()
      request.headers.set("x-stack-auth", JSON.stringify(authJson));
      return request;
    },
  };

  const fetchClient = createFetchClient<paths>({
    baseUrl: import.meta.env.VITE_PUBLIC_BACKEND_URL,
  });
  fetchClient.use(authMiddleware);

  const apiClient = createClient(fetchClient);

  const setQueryData = <
    Method extends HttpMethod,
    Path extends PathsWithMethod<paths, Method>,
    Init extends MaybeOptionalInit<paths[Path], Method>,
    Data extends MethodResponse<typeof apiClient, Method, Path>
  >(
    method: Method,
    path: Path,
    init: Init,
    updater: (oldData: Data | undefined) => Data | undefined
  ) => {
    const queryKey = init === undefined ? [method, path] as const : [method, path, init] as const;
    queryClient.setQueryData<Data>(queryKey, updater);
  };

  const parseSSEStream = <
    Method extends HttpMethod,
    Path extends PathsWithMethod<paths, Method>,
    Init extends MaybeOptionalInit<paths[Path], Method>,
    Data extends MethodResponse<typeof apiClient, Method, Path>,
  >(
    method: Method,
    path: Path,
    init: Init,
    callback: (event: Data) => void,
  ) => {
    const controller = new AbortController();
    const promise = fetchClient.request(method, path, { 
      ...init, 
      parseAs: "stream",
      signal: controller.signal 
    } as any).then(({ response, error }) => {
      if (error) throw error;
      parseSSEStreamHelper<Data>(response, callback);
    }).catch(() => {})
    

    return {
      cancel: () => controller.abort('Stream cancelled'),
      promise
    };
  }

  const invalidateQueries = <
    Method extends HttpMethod,
    Path extends PathsWithMethod<paths, Method>,
    Init extends MaybeOptionalInit<paths[Path], Method>,
  >(
    method: Method,
    path: Path,
    init: Init,
  ) => {
    const queryKey = init === undefined ? [method, path] as const : [method, path, init] as const;
    queryClient.invalidateQueries({ queryKey });
  };

  return {
    $fetch: fetchClient,
    $api: apiClient,
    $setQueryData: setQueryData,
    $invalidateQueries: invalidateQueries,
    $parseSSEStream: parseSSEStream,
  }
};
