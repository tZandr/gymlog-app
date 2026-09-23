import { createContext } from "react";
import type { User } from "@supabase/supabase-js";
import type { IProfile } from "../types/Profile";

export interface AuthContextType {
  user: User | null;
  profile: IProfile | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  login: async () => {},
  logout: async () => {},
});
