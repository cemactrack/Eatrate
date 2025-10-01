export { 
  getAPI_URL,
  getSUPABASE_URL,
  getSUPABASE_ANON_KEY
} from './env';

export const API_URL = () => getAPI_URL();
export const SUPABASE_URL = () => getSUPABASE_URL();
export const SUPABASE_ANON_KEY = () => getSUPABASE_ANON_KEY();

export function getApiBase(): string {
  return getAPI_URL();
}

export function getAllowedOrigins(): string[] {
  return [
    'https://eatrate.vercel.app',
    'http://localhost:8081',
    'http://localhost:19006',
  ];
}
