import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { User } from "@shared/schema";

export interface UseAuthResult {
  user: User | null | undefined;
  isLoading: boolean;
  isAuthenticated: boolean;
  logout: () => Promise<void>;
}

export function useAuth(): UseAuthResult {
  const queryClient = useQueryClient();
  
  const { data: user, isLoading, error } = useQuery<User | null>({
    queryKey: ["/api/auth/user"],
    retry: false,
    queryFn: async () => {
      const response = await fetch("/api/auth/user", {
        credentials: "include",
      });
      
      if (response.status === 401) {
        return null;
      }
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    },
  });

  const logout = async () => {
    try {
      // Clear the user data from the cache first
      queryClient.setQueryData(["/api/auth/user"], null);
      queryClient.clear();
      
      // Call the logout API (this will redirect to login page)
      window.location.href = "/api/logout";
    } catch (error) {
      console.error("Logout failed:", error);
      // Even if logout fails, redirect to login page
      window.location.href = "/login";
    }
  };

  return {
    user: error ? null : user,
    isLoading,
    isAuthenticated: !!user && !error,
    logout,
  };
}
