import Constants from 'expo-constants';

export type Env = {
  API_URL: string;
  SUPABASE_URL: string;
  SUPABASE_ANON_KEY: string;
};

function readFromProcess(): Partial<Env> {
  const result: Partial<Env> = {};
  if (process.env.EXPO_PUBLIC_API_URL) {
    result.API_URL = process.env.EXPO_PUBLIC_API_URL;
  }
  if (process.env.EXPO_PUBLIC_SUPABASE_URL) {
    result.SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
  }
  if (process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY) {
    result.SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
  }
  return result;
}

function readFromExpoExtra(): Partial<Env> {
  try {
    const extra = (Constants?.expoConfig as any)?.extra ?? {};
    return {
      API_URL: extra?.EXPO_PUBLIC_API_URL ?? extra?.apiUrl ?? extra?.API_URL,
      SUPABASE_URL: extra?.EXPO_PUBLIC_SUPABASE_URL ?? extra?.supabaseUrl ?? extra?.SUPABASE_URL,
      SUPABASE_ANON_KEY:
        extra?.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? extra?.supabaseAnonKey ?? extra?.SUPABASE_ANON_KEY,
    } as Partial<Env>;
  } catch (error) {
    console.warn('[env] Failed to read from expo config:', error);
    return {};
  }
}

function validate(values: Partial<Env>, throwOnMissing = true): asserts values is Env {
  const missing: string[] = [];
  if (!values.API_URL) missing.push('EXPO_PUBLIC_API_URL');
  if (!values.SUPABASE_URL) missing.push('EXPO_PUBLIC_SUPABASE_URL');
  if (!values.SUPABASE_ANON_KEY) missing.push('EXPO_PUBLIC_SUPABASE_ANON_KEY');

  if (missing.length > 0) {
    const hint =
      'Missing env vars: ' +
      missing.join(', ') +
      '. Provide via app config (app.json -> expo.extra) or Expo env (EXPO_PUBLIC_*).';
    
    console.warn('[env] ' + hint);
    console.warn('[env] Process env:', {
      hasAPI: Boolean(process.env.EXPO_PUBLIC_API_URL),
      hasSupabase: Boolean(process.env.EXPO_PUBLIC_SUPABASE_URL),
      hasKey: Boolean(process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY)
    });
    console.warn('[env] Expo extra:', Constants?.expoConfig?.extra);
    
    if (throwOnMissing) {
      throw new Error(hint);
    }
  }
}

let cachedEnv: Env | null = null;

export function getEnv(throwOnMissing = true): Env {
  if (cachedEnv) return cachedEnv;
  
  const fromProcess = readFromProcess();
  const fromExtra = readFromExpoExtra();
  // Prefer values from Expo app config (app.json -> extra) over process env for Expo/Web dev
  // This avoids stale global envs forcing production URLs during local development
  const merged: Partial<Env> = { ...fromProcess, ...fromExtra };
  
  console.log('[env] Loading environment variables...');
  console.log('[env] From process:', Object.keys(fromProcess));
  console.log('[env] From extra:', Object.keys(fromExtra));
  console.log('[env] Merged:', Object.keys(merged));
  
  validate(merged, throwOnMissing);
  cachedEnv = merged;
  return merged;
}

export function getAPI_URL(): string {
  return getEnv().API_URL;
}

export function getSUPABASE_URL(): string {
  return getEnv().SUPABASE_URL;
}

export function getSUPABASE_ANON_KEY(): string {
  return getEnv().SUPABASE_ANON_KEY;
}

export let API_URL: string;
export let SUPABASE_URL: string;
export let SUPABASE_ANON_KEY: string;

try {
  const env = getEnv(false);
  API_URL = env.API_URL || '';
  SUPABASE_URL = env.SUPABASE_URL || '';
  SUPABASE_ANON_KEY = env.SUPABASE_ANON_KEY || '';
} catch (error) {
  console.warn('[env] Failed to initialize env constants:', error);
  API_URL = '';
  SUPABASE_URL = '';
  SUPABASE_ANON_KEY = '';
}
