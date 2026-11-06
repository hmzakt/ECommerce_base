export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string | null;
  role: "CUSTOMER" | "ADMIN" | "SUPER_ADMIN";
  isEmailVerified?: boolean;
  authProvider?: "LOCAL" | "GOOGLE" | "LOCAL_GOOGLE";
  createdAt?: string;
}

export interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone?: string;
}
