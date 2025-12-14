import { QueryClient, QueryFunction } from "@tanstack/react-query";

/**
 * DEVELOPMENT ROLE OVERRIDE:
 * 
 * In development mode, we read the dev role from localStorage and include it
 * as an X-Dev-Role header in all API requests. This allows the backend to
 * simulate different user roles for testing purposes.
 * 
 * We read from localStorage directly (rather than React context) because
 * these functions are called outside of React component tree.
 * The DevRoleContext persists the role to localStorage, so they stay in sync.
 */
function getDevRoleHeader(): Record<string, string> {
  // Only in development mode (Vite sets this at build time)
  if (import.meta.env.PROD) {
    return {};
  }
  
  const devRole = localStorage.getItem("dev-role-override");
  if (devRole && ["admin", "fiscal", "operador", "visualizador"].includes(devRole)) {
    return { "X-Dev-Role": devRole };
  }
  return {};
}

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  // Include dev role header for backend role simulation in development
  const devRoleHeader = getDevRoleHeader();
  
  const res = await fetch(url, {
    method,
    headers: {
      ...(data ? { "Content-Type": "application/json" } : {}),
      ...devRoleHeader,
    },
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    // Include dev role header for backend role simulation in development
    const devRoleHeader = getDevRoleHeader();
    
    const res = await fetch(queryKey.join("/") as string, {
      credentials: "include",
      headers: devRoleHeader,
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
