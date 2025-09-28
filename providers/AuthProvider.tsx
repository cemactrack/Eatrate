import { useCallback, useEffect, useMemo, useState } from 'react';
import createContextHook from '@nkzw/create-context-hook';
import { Alert } from 'react-native';
import { supabase } from '@/lib/supabase';

export interface AuthContextUser {
  id: string;
  email?: string;
  displayName?: string;
  avatar?: string;
}

interface AuthContextValue {
  user: AuthContextUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

export const [AuthProvider, useAuthInternal] = createContextHook<AuthContextValue>(() => {
  const [user, setUser] = useState<AuthContextUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const signIn = useCallback(async (email: string, password: string) => {
    if (!supabase) {
      Alert.alert('Auth not configured', 'Supabase client is not initialized.');
      return;
    }
    const { error, data } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      console.error('[Auth] signIn error', error);
      Alert.alert('Sign in failed', error.message);
      return;
    }
    console.log('[Auth] signIn ok', Boolean(data.session));
  }, []);

  const signUp = useCallback(async (email: string, password: string) => {
    if (!supabase) {
      Alert.alert('Auth not configured', 'Supabase client is not initialized.');
      return;
    }
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) {
      console.error('[Auth] signUp error', error);
      Alert.alert('Sign up failed', error.message);
      return;
    }
    Alert.alert('Check your email', 'We sent you a confirmation link.');
  }, []);

  const signOut = useCallback(async () => {
    if (!supabase) return;
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('[Auth] signOut error', error);
      Alert.alert('Sign out failed', error.message);
    }
  }, []);

  useEffect(() => {
    let active = true;
    const init = async () => {
      try {
        if (!supabase) return;
        const { data } = await supabase.auth.getSession();
        const sessUser = data.session?.user;
        setUser(
          sessUser
            ? {
                id: sessUser.id,
                email: sessUser.email ?? undefined,
                displayName: sessUser.user_metadata?.full_name ?? sessUser.email ?? undefined,
                avatar: sessUser.user_metadata?.avatar_url ?? undefined,
              }
            : null
        );
      } catch (e) {
        console.error('[Auth] getSession error', e);
      } finally {
        if (active) setLoading(false);
      }
    };

    init();

    if (!supabase) return () => {};
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      const next = session?.user
        ? {
            id: session.user.id,
            email: session.user.email ?? undefined,
            displayName: session.user.user_metadata?.full_name ?? session.user.email ?? undefined,
            avatar: session.user.user_metadata?.avatar_url ?? undefined,
          }
        : null;
      console.log('[Auth] onAuthStateChange', { hasUser: Boolean(next) });
      setUser(next);
    });

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  return useMemo(() => ({
    user,
    loading,
    signIn,
    signUp,
    signOut,
  }), [user, loading, signIn, signUp, signOut]);
});

export const useAuth = (): AuthContextValue => {
  const ctx = useAuthInternal();
  return ctx;
};
