import createFetchClient from "openapi-fetch"
import type { paths } from "@/generated/openapi";
import type { Middleware } from "openapi-fetch";
import { useUser } from "@stackframe/react";

export const useAuthClient = () => {
  const user = useUser({ or: "redirect" });
  
  const authMiddleware: Middleware = {
    async onRequest({ request }) {
      const authJson = await user.getAuthJson()
      request.headers.set("x-stack-auth", JSON.stringify(authJson));
      return request;
    },
  };

  const client = createFetchClient<paths>({
    baseUrl: import.meta.env.VITE_PUBLIC_BACKEND_URL,
  });
  
  client.use(authMiddleware);
  
  return client;
};