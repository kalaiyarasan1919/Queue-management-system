import { QueryClient, QueryFunction } from "@tanstack/react-query";
import axios, { AxiosError, AxiosResponse } from 'axios';

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest<T = any>(
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
  url: string,
  data?: any,
  headers?: Record<string, string>
): Promise<T> {
  try {
    const base = (import.meta as any)?.env?.VITE_API_BASE_URL || '';
    const response: AxiosResponse<T> = await axios({
      method,
      url: `${base}${url}`,
      data,
      headers: {
        ...headers,
      },
      // Use cookies for auth (server uses session)
      withCredentials: true,
    });
    
    return response.data;
  } catch (error) {
    if ((error as AxiosError).response?.status === 401) {
      // Handle unauthorized error
      throw error;
    }
    throw error;
  }
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const res = await fetch(queryKey.join("/") as string, {
      credentials: "include",
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
