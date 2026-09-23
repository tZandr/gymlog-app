import { createContext } from "react";
import type { User } from "@supabase/supabase-js";
import type { IProfile } from "../types/Profile";
import { NO_ACCESS, type MyAccess } from "../api/access";

export interface AuthContextType {
  user: User | null;
  profile: IProfile | null;
  /** Coach plan / pending requests / pending admin invite for the signed-in user. */
  access: MyAccess;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  /** Re-read the profile and access (after e.g. accepting an admin invite). Doesn't blank the app. */
  refresh: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  access: NO_ACCESS,
  loading: true,
  login: async () => {},
  logout: async () => {},
  refresh: async () => {},
});
