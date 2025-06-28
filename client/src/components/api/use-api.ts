import createClient from "openapi-react-query";
import type { paths } from "@/generated/openapi";
import { useAuthClient } from "./use-auth-client";
import { useQueryHelpers } from "./use-query-client";
import { useSSEStream } from "./use-sse-stream";

export const useApi = () => {
  const fetchClient = useAuthClient();
  const apiClient = createClient(fetchClient);
  const { setQueryData, invalidateQueries } = useQueryHelpers();
  const { parseSSEStream } = useSSEStream();

  return {
    $fetch: fetchClient,
    $api: apiClient,
    $setQueryData: setQueryData,
    $invalidateQueries: invalidateQueries,
    $parseSSEStream: parseSSEStream,
  };
};
