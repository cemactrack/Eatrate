import Constants from 'expo-constants';

export type Env = {
  API_URL: string;
  SUPABASE_URL: string;
  SUPABASE_ANON_KEY: string;
};

function readFromProcess(): Partial<Env> {
  return {
    API_URL: process.env.EXPO_PUBLIC_API_URL,
    SUPABASE_URL: process.env.EXPO_PUBLIC_SUPABASE_URL,
    SUPABASE_ANON_KEY: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
  } as Partial<Env>;
}

function readFromExpoExtra(): Partial<Env> {
  const extra = (Constants?.expoConfig as any)?.extra ?? {};
  return {
    API_URL: extra?.EXPO_PUBLIC_API_URL ?? extra?.apiUrl ?? extra?.API_URL,
    SUPABASE_URL: extra?.EXPO_PUBLIC_SUPABASE_URL ?? extra?.supabaseUrl ?? extra?.SUPABASE_URL,
    SUPABASE_ANON_KEY:
      extra?.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? extra?.supabaseAnonKey ?? extra?.SUPABASE_ANON_KEY,
  } as Partial<Env>;
}

function validate(values: Partial<Env>): asserts values is Env {
  const missing: string[] = [];
  if (!values.API_URL) missing.push('EXPO_PUBLIC_API_URL');
  if (!values.SUPABASE_URL) missing.push('EXPO_PUBLIC_SUPABASE_URL');
  if (!values.SUPABASE_ANON_KEY) missing.push('EXPO_PUBLIC_SUPABASE_ANON_KEY');

  if (missing.length > 0) {
    const hint =
      'Missing env vars: ' +
      missing.join(', ') +
      '. Provide via app config (app.json -> expo.extra) or Expo env (EXPO_PUBLIC_*).';
    throw new Error(hint);
  }
}

export function getEnv(): Env {
  const fromProcess = readFromProcess();
  const fromExtra = readFromExpoExtra();
  const merged: Partial<Env> = { ...fromExtra, ...fromProcess };
  validate(merged);
  return merged;
}

export const { API_URL, SUPABASE_URL, SUPABASE_ANON_KEY } = getEnv();
