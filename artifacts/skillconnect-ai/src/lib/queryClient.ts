import { QueryClient } from "@tanstack/react-query";

export class FetchError extends Error {
  status: number;
  data: unknown;

  constructor(message: string, status: number, data: unknown) {
    super(message);
    this.name = "FetchError";
    this.status = status;
    this.data = data;
  }
}

async function defaultFetcher<T>(url: string): Promise<T> {
  const response = await fetch(url, {
    credentials: "include",
    headers: { accept: "application/json" },
  });

  if (!response.ok) {
    const data = await response.json().catch(() => null);
    throw new FetchError(`HTTP ${response.status} ${response.statusText}`, response.status, data);
  }

  return response.json() as Promise<T>;
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: async ({ queryKey }) => {
        const [url] = queryKey as [string];
        return defaultFetcher(url);
      },
      refetchOnWindowFocus: false,
      retry: false,
      staleTime: 30_000,
    },
    mutations: {
      retry: false,
    },
  },
});
