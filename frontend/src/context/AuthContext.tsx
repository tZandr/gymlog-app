import { useCallback, useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "../lib/supabaseClient";
import { getProfile } from "../api/Profile";
import { getMyAccess, NO_ACCESS, type MyAccess } from "../api/access";
import { rememberAccount } from "../lib/accountFlag";
import type { IProfile } from "../types/Profile";
import { AuthContext } from "./authContextObject";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<IProfile | null>(null);
  const [access, setAccess] = useState<MyAccess>(NO_ACCESS);
  // "Loading" means: we don't yet know who is signed in, or we're loading a *different* user's data.
  // Re-reading the same user's data (refresh, or supabase-js re-firing SIGNED_IN when the tab
  // regains focus) never flips this, so pages keep their state.
  const [dataReady, setDataReady] = useState(false);
  const loadedFor = useRef<string | undefined>(undefined);

  const loadUserData = useCallback(async (userId: string | undefined) => {
    if (!userId) {
      loadedFor.current = undefined;
      setProfile(null);
      setAccess(NO_ACCESS);
      setDataReady(true);
      return;
    }
    if (loadedFor.current !== userId) setDataReady(false);
    const [p, a] = await Promise.allSettled([getProfile(), getMyAccess()]);
    loadedFor.current = userId;
    setProfile(p.status === "fulfilled" ? p.value : null);
    setAccess(a.status === "fulfilled" ? a.value : NO_ACCESS);
    setDataReady(true);
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      void loadUserData(data.session?.user.id);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((event, newSession) => {
      setSession(newSession);
      if (newSession) rememberAccount();
      if (newSession && loadedFor.current !== newSession.user.id) setDataReady(false);
      if (event !== "TOKEN_REFRESHED") {
        // Deferred: supabase-js can deadlock if other supabase calls run inside this callback.
        setTimeout(() => void loadUserData(newSession?.user.id), 0);
      }
    });

    return () => listener.subscription.unsubscribe();
  }, [loadUserData]);

  const refresh = useCallback(() => loadUserData(session?.user.id), [loadUserData, session]);

  const login = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  };

  const logout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider
      value={{ user: session?.user ?? null, profile, access, loading: !dataReady, login, logout, refresh }}
    >
      {children}
    </AuthContext.Provider>
  );
}
