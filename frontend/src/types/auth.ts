export enum AuthMode {
  LOGIN = 'LOGIN',
  REGISTER = 'REGISTER'
}

export interface User {
  id: string;
  email: string;
  username: string;
  is_active: boolean;
  created_at: string;
  last_login: string | null;
}

export interface AuthCredentials {
  email: string;
  password: string;
}

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
}

export interface AuthError {
  detail: string;
}

export interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: AuthCredentials) => Promise<void>;
  register: (credentials: AuthCredentials) => Promise<void>;
  logout: () => void;
}