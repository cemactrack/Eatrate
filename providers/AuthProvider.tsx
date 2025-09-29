import { useCallback, useEffect, useMemo, useState } from 'react';
import createContextHook from '@nkzw/create-context-hook';
import { Alert } from 'react-native';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

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
    if (!isSupabaseConfigured()) {
      const message = 'Authentication is not configured. Please check your environment variables.';
      console.error('[Auth] signIn failed:', message);
      Alert.alert('Auth not configured', message);
      return;
    }
    
    try {
      setLoading(true);
      const { error, data } = await supabase!.auth.signInWithPassword({ email, password });
      if (error) {
        console.error('[Auth] signIn error:', error.message);
        Alert.alert('Sign in failed', error.message);
        return;
      }
      console.log('[Auth] signIn successful:', Boolean(data.session));
    } catch (err) {
      console.error('[Auth] signIn unexpected error:', err);
      Alert.alert('Sign in failed', 'An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  const signUp = useCallback(async (email: string, password: string) => {
    if (!isSupabaseConfigured()) {
      const message = 'Authentication is not configured. Please check your environment variables.';
      console.error('[Auth] signUp failed:', message);
      Alert.alert('Auth not configured', message);
      return;
    }
    
    try {
      setLoading(true);
      const { error } = await supabase!.auth.signUp({ email, password });
      if (error) {
        console.error('[Auth] signUp error:', error.message);
        Alert.alert('Sign up failed', error.message);
        return;
      }
      console.log('[Auth] signUp successful - check email for confirmation');
      Alert.alert('Check your email', 'We sent you a confirmation link.');
    } catch (err) {
      console.error('[Auth] signUp unexpected error:', err);
      Alert.alert('Sign up failed', 'An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  const signOut = useCallback(async () => {
    if (!isSupabaseConfigured()) {
      console.error('[Auth] signOut failed: Supabase not configured');
      return;
    }
    
    try {
      setLoading(true);
      const { error } = await supabase!.auth.signOut();
      if (error) {
        console.error('[Auth] signOut error:', error.message);
        Alert.alert('Sign out failed', error.message);
        return;
      }
      console.log('[Auth] signOut successful');
    } catch (err) {
      console.error('[Auth] signOut unexpected error:', err);
      Alert.alert('Sign out failed', 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    const init = async () => {
      try {
        if (!isSupabaseConfigured()) {
          console.warn('[Auth] Supabase not configured - skipping session restore');
          return;
        }
        
        console.log('[Auth] Restoring session...');
        const { data, error } = await supabase!.auth.getSession();
        
        if (error) {
          console.error('[Auth] getSession error:', error.message);
          return;
        }
        
        const sessUser = data.session?.user;
        const authUser = sessUser
          ? {
              id: sessUser.id,
              email: sessUser.email ?? undefined,
              displayName: sessUser.user_metadata?.full_name ?? sessUser.email ?? undefined,
              avatar: sessUser.user_metadata?.avatar_url ?? undefined,
            }
          : null;
          
        console.log('[Auth] Session restored:', { hasUser: Boolean(authUser) });
        setUser(authUser);
      } catch (e) {
        console.error('[Auth] getSession unexpected error:', e);
      } finally {
        if (active) setLoading(false);
      }
    };

    init();

    if (!isSupabaseConfigured()) {
      return () => {
        active = false;
      };
    }
    
    const { data: sub } = supabase!.auth.onAuthStateChange((event, session) => {
      console.log('[Auth] Auth state changed:', event);
      const next = session?.user
        ? {
            id: session.user.id,
            email: session.user.email ?? undefined,
            displayName: session.user.user_metadata?.full_name ?? session.user.email ?? undefined,
            avatar: session.user.user_metadata?.avatar_url ?? undefined,
          }
        : null;
      console.log('[Auth] onAuthStateChange', { event, hasUser: Boolean(next) });
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
