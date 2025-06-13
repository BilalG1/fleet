import { useUser } from "@stackframe/react";
import { useEffect, useState } from "react";


export function useGhToken() {
  const user = useUser({ or: 'redirect' });
  const [ghToken, setGhToken] = useState<string | null>(null);

  useEffect(() => {
    user.getConnectedAccount('github', { or: 'redirect', scopes: ['public_repo'] })
    .then(account => account.getAccessToken())
    .then(data => setGhToken(data.accessToken));
  }, []);
  
  return { ghToken };
}