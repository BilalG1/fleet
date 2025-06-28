import type { HttpMethod, PathsWithMethod } from "openapi-typescript-helpers";
import type { paths } from "@/generated/openapi";
import type { MaybeOptionalInit } from "openapi-fetch";
import { parseSSEStreamHelper } from "@/lib/stream";
import { useAuthClient } from "./use-auth-client";

export const useSSEStream = () => {
  const client = useAuthClient();

  const parseSSEStream = <
    Method extends HttpMethod,
    Path extends PathsWithMethod<paths, Method>,
    Init extends MaybeOptionalInit<paths[Path], Method>,
    Data = any,
  >(
    method: Method,
    path: Path,
    init: Init,
    callback: (event: Data) => void,
  ) => {
    const controller = new AbortController();
    const promise = client.request(method, path, { 
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

  return { parseSSEStream };
};