'use client';
import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import type { PublicUser } from '@/types';
import { api } from '@/lib/client';
type AuthContextValue = { user: PublicUser | null; ready: boolean; refresh: () => Promise<void> };
const AuthContext = createContext<AuthContextValue>({ user: null, ready: false, refresh: async () => {} });
export function AuthProvider({ children }: { children: React.ReactNode }) {
 const [user, setUser] = useState<PublicUser | null>(null);
 const [ready, setReady] = useState(false);
 const refresh = useCallback(async () => {
  try { const result = await api<{ user: PublicUser | null }>('/api/me'); setUser(result.user); }
  catch { setUser(null); }
  finally { setReady(true); }
 }, []);
 // Synchronize state with the external session, URL or network request.
 // eslint-disable-next-line react-hooks/set-state-in-effect
 useEffect(() => { void refresh(); }, [refresh]);
 return <AuthContext.Provider value={{ user, ready, refresh }}>{children}</AuthContext.Provider>;
}
export function useAuth() { return useContext(AuthContext); }
