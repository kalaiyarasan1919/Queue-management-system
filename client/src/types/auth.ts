export interface User {
  id: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  profileImageUrl: string | null;
  password: string | null;
  authProvider: string;
  providerId: string | null;
  role: string;
  isEmailVerified: boolean;
  createdAt: Date | null;
  updatedAt: Date | null;
}

export interface AuthContextType {
  user: User | undefined;
  isLoading: boolean;
  error: string | null;
  getAccessToken: () => Promise<string | null>;
  login: (credentials: { email: string; password: string }) => Promise<void>;
  logout: () => Promise<void>;
  register: (userData: any) => Promise<void>;
}
