"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { clearTrustedDevicePreference } from "@/lib/auth/trusted-device";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/client";

type AuthStatus = "loading" | "authenticated" | "anonymous";

interface AuthSessionValue {
  status: AuthStatus;
  user: User | null;
  signOut: () => Promise<void>;
}

const AuthSessionContext = createContext<AuthSessionValue | null>(null);

export function AuthSessionProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>(
    isSupabaseConfigured() ? "loading" : "anonymous",
  );
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    if (!isSupabaseConfigured()) return;
    const supabase = createClient();
    let active = true;
    let authoritativeEventObserved = false;

    void supabase.auth
      .getUser()
      .then(({ data }) => {
        if (!active || authoritativeEventObserved) return;
        setUser(data.user);
        setStatus(data.user ? "authenticated" : "anonymous");
      })
      .catch(() => {
        if (!active || authoritativeEventObserved) return;
        setUser(null);
        setStatus("anonymous");
      });

    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (!active) return;
      // INITIAL_SESSION reflects locally stored tokens. Keep the shell neutral
      // until getUser() has verified them with Supabase.
      if (event === "INITIAL_SESSION") return;
      authoritativeEventObserved = true;
      setUser(session?.user ?? null);
      setStatus(session?.user ? "authenticated" : "anonymous");
    });

    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  const value = useMemo<AuthSessionValue>(
    () => ({
      status,
      user,
      async signOut() {
        if (isSupabaseConfigured()) {
          await createClient().auth.signOut({ scope: "local" });
        }
        clearTrustedDevicePreference();
        setUser(null);
        setStatus("anonymous");
      },
    }),
    [status, user],
  );

  return <AuthSessionContext.Provider value={value}>{children}</AuthSessionContext.Provider>;
}

export function useAuthSession() {
  const value = useContext(AuthSessionContext);
  if (!value) throw new Error("useAuthSession must be used inside AuthSessionProvider");
  return value;
}
