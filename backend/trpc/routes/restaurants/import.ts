import { z } from "zod";
import { publicProcedure } from "@/backend/trpc/create-context";
import { promises as fs } from 'fs';
import { join } from 'path';

interface ParsedRestaurant {
  id: string;
  name: string;
  cuisine: string;
  rating: number;
  reviewCount: number;
  image: string;
  address: string;
  priceRange: '$' | '$$' | '$$$' | '$$$$';
  isOpen: boolean;
  tags: string[];
  verified: boolean;
  claimed: boolean;
}

function safeNumber(n: unknown): number {
  const num = typeof n === 'number' ? n : Number(String(n ?? '').replace(/[^0-9.]/g, ''));
  return Number.isFinite(num) ? num : 0;
}

function mapPriceRange(input: unknown): ParsedRestaurant['priceRange'] {
  const s = String(input ?? '').trim();
  if (s === '$' || s === '$$' || s === '$$$' || s === '$$$$') return s;
  return '$$';
}

function firstString(v: unknown): string {
  if (Array.isArray(v)) return String(v[0] ?? '');
  if (v && typeof v === 'object' && 'name' in (v as any)) return String((v as any).name ?? '');
  return String(v ?? '');
}

function toRestaurant(item: any, fallbackCity: string): ParsedRestaurant | null {
  try {
    const url: string = String(item.url ?? item['@id'] ?? '').trim();
    const slug = url ? url.split('/').filter(Boolean).pop() ?? String(Date.now()) : String(Date.now());

    const cuisinesRaw = item.servesCuisine ?? item.cuisine ?? [];
    const cuisines: string[] = Array.isArray(cuisinesRaw) ? cuisinesRaw.map(firstString).filter(Boolean) : [firstString(cuisinesRaw)].filter(Boolean);

    const ratingValue = safeNumber(item.aggregateRating?.ratingValue ?? item.ratingValue);
    const reviewCount = safeNumber(item.aggregateRating?.reviewCount ?? item.reviewCount);

    const image = firstString(item.image ?? item.photo ?? '');

    const addressObj = item.address as any;
    const address = addressObj?.streetAddress
      ? [addressObj.streetAddress, addressObj.addressLocality, addressObj.addressRegion].filter(Boolean).join(', ')
      : firstString(addressObj ?? fallbackCity);

    const priceRange = mapPriceRange(item.priceRange ?? item.price ?? item.priceLevel);

    const name = String(item.name ?? '').trim();
    if (!name) return null;

    const tags = Array.from(new Set([...(cuisines || []), String(item['@type'] ?? '').replace('Restaurant', '').trim()].filter(Boolean)));

    const restaurant: ParsedRestaurant = {
      id: slug,
      name,
      cuisine: cuisines[0] ?? 'International',
      rating: ratingValue,
      reviewCount,
      image: image || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&h=600&fit=crop',
      address: address || fallbackCity,
      priceRange,
      isOpen: true,
      tags,
      verified: false,
      claimed: false,
    };

    return restaurant;
  } catch (e) {
    console.log('[import.parse] error converting item', e);
    return null;
  }
}

function extractJsonLd(html: string): any[] {
  const results: any[] = [];
  const scriptRegex = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let match: RegExpExecArray | null;
  while ((match = scriptRegex.exec(html)) !== null) {
    const raw = match[1].trim();
    try {
      const cleaned = raw.replace(/\u0000/g, '').replace(/\n|\t/g, ' ');
      const json = JSON.parse(cleaned);
      if (Array.isArray(json)) {
        results.push(...json);
      } else {
        results.push(json);
      }
    } catch (e) {
      try {
        const wrapped = `[${raw.replace(/}\s*{/, '},{')}]`;
        const json = JSON.parse(wrapped);
        results.push(...(Array.isArray(json) ? json : [json]));
      } catch (e2) {
        console.log('[import.jsonld] parse failure, skipping block');
      }
    }
  }
  return results;
}

const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 1000 * 60 * 60 * 12; // 12 hours

// Simple file-based database for restaurants
const DB_PATH = join(process.cwd(), 'data');
const RESTAURANTS_DB_FILE = join(DB_PATH, 'restaurants.json');

// Ensure data directory exists
async function ensureDataDir() {
  try {
    await fs.mkdir(DB_PATH, { recursive: true });
  } catch (e) {
  }
}

// Save restaurants to database
async function saveRestaurantsToDb(restaurants: ParsedRestaurant[]): Promise<void> {
  try {
    await ensureDataDir();
    const data = {
      restaurants,
      lastUpdated: new Date().toISOString(),
      count: restaurants.length
    };
    await fs.writeFile(RESTAURANTS_DB_FILE, JSON.stringify(data, null, 2), 'utf8');
    console.log(`[DB] Saved ${restaurants.length} restaurants to database`);
  } catch (error) {
    console.error('[DB] Failed to save restaurants:', error);
    throw error;
  }
}

// Load restaurants from database
async function loadRestaurantsFromDb(): Promise<ParsedRestaurant[]> {
  try {
    const data = await fs.readFile(RESTAURANTS_DB_FILE, 'utf8');
    const parsed = JSON.parse(data);
    console.log(`[DB] Loaded ${parsed.restaurants?.length || 0} restaurants from database`);
    return parsed.restaurants || [];
  } catch (error) {
    if ((error as any).code === 'ENOENT') {
      console.log('[DB] No existing restaurant database found');
      return [];
    }
    console.error('[DB] Failed to load restaurants:', error);
    return [];
  }
}

// Check if database exists and has data
async function isDatabasePopulated(): Promise<boolean> {
  try {
    const data = await fs.readFile(RESTAURANTS_DB_FILE, 'utf8');
    const parsed = JSON.parse(data);
    return Array.isArray(parsed.restaurants) && parsed.restaurants.length > 0;
  } catch {
    return false;
  }
}

async function fetchWithRetry(url: string, attempts: number = 2): Promise<string> {
  let lastErr: any = null;
  for (let i = 0; i < attempts; i++) {
    try {
      const res = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; EatRateBot/1.0; +https://example.com) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123 Safari/537.36',
          'Accept-Language': 'en-US,en;q=0.9',
        },
        signal: AbortSignal.timeout(30000),
      });
      if (!res.ok) throw new Error(`Failed to fetch TripAdvisor: ${res.status}`);
      return await res.text();
    } catch (e) {
      lastErr = e;
      const delay = 500 * (i + 1);
      await new Promise(r => setTimeout(r, delay));
    }
  }
  throw lastErr ?? new Error('Failed to fetch after retries');
}

async function fetchPage(url: string): Promise<string> {
  const cacheKey = `page_${url}`;
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }
  const text = await fetchWithRetry(url, 2);
  cache.set(cacheKey, { data: text, timestamp: Date.now() });
  return text;
}

export const importFromTripadvisorProcedure = publicProcedure
  .input(z.object({
    urls: z.array(z.string().url()).min(1),
    cityFallback: z.string().default('Cameroon')
  }))
  .mutation(async ({ input }) => {
    const targetUrls = input.urls;
    console.log('[tRPC] One-time import TripAdvisor', { count: targetUrls.length });

    async function fetchAndParse(url: string): Promise<ParsedRestaurant[]> {
      const html = await fetchPage(url);
      const blocks = extractJsonLd(html);
      const items: ParsedRestaurant[] = [];

      for (const block of blocks) {
        const graph = (block as any)['@graph'];
        const itemList = (block as any).itemListElement;

        if (Array.isArray(graph)) {
          for (const node of graph) {
            if (
              node['@type'] === 'Restaurant' ||
              (Array.isArray(node['@type']) && node['@type'].includes('Restaurant'))
            ) {
              const r = toRestaurant(node, input.cityFallback);
              if (r) items.push(r);
            }
          }
        }

        if (Array.isArray(itemList)) {
          for (const el of itemList) {
            const item = (el as any).item ?? el;
            if (
              item &&
              (item['@type'] === 'Restaurant' ||
                (Array.isArray(item['@type']) && item['@type'].includes('Restaurant')))
            ) {
              const r = toRestaurant(item, input.cityFallback);
              if (r) items.push(r);
            }
          }
        }

        if ((block as any)['@type'] === 'Restaurant') {
          const r = toRestaurant(block, input.cityFallback);
          if (r) items.push(r);
        }
      }

      return items;
    }

    const allItems: ParsedRestaurant[] = [];
    const maxConcurrent = 2;
    for (let i = 0; i < targetUrls.length; i += maxConcurrent) {
      const batch = targetUrls.slice(i, i + maxConcurrent);
      const results = await Promise.all(
        batch.map(async (url) => {
          try {
            return await fetchAndParse(url);
          } catch (e: any) {
            console.log('[tRPC] Import page fetch error', url, e?.message ?? e);
            return [];
          }
        })
      );
      results.forEach(items => allItems.push(...items));
    }

    const unique = new Map<string, ParsedRestaurant>();
    for (const it of allItems) {
      const key = it.name.trim().toLowerCase();
      if (!unique.has(key)) unique.set(key, it);
    }

    const restaurants = Array.from(unique.values());

    await saveRestaurantsToDb(restaurants);
    cache.set('ONE_TIME_IMPORTED_RESTAURANTS', { data: restaurants, timestamp: Date.now() });

    console.log(`[tRPC] Successfully imported and saved ${restaurants.length} restaurants to database`);
    return { success: true as const, imported: restaurants.length, restaurants };
  });

export async function getOneTimeImportedRestaurants(): Promise<ParsedRestaurant[]> {
  const cached = cache.get('ONE_TIME_IMPORTED_RESTAURANTS');
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data as ParsedRestaurant[];
  }
  const restaurants = await loadRestaurantsFromDb();
  if (restaurants.length > 0) {
    cache.set('ONE_TIME_IMPORTED_RESTAURANTS', { data: restaurants, timestamp: Date.now() });
  }
  return restaurants;
}

export const getImportedOneTimeProcedure = publicProcedure.query(async () => {
  const restaurants = await getOneTimeImportedRestaurants();
  return { restaurants };
});

export const needsInitialImportProcedure = publicProcedure.query(async () => {
  const isPopulated = await isDatabasePopulated();
  return { needsImport: !isPopulated };
});

export const bootstrapImportProcedure = publicProcedure.mutation(async () => {
  const isPopulated = await isDatabasePopulated();
  if (isPopulated) {
    const restaurants = await loadRestaurantsFromDb();
    return { success: true, imported: 0, restaurants, message: 'Database already populated' };
  }

  console.log('[tRPC] Starting bootstrap import from TripAdvisor...');
  const DEFAULT_URLS = [
    'https://www.tripadvisor.com/Restaurants-g293773-Douala_Littoral_Region.html',
    'https://www.tripadvisor.com/Restaurants-g293770-Yaounde_Centre_Region.html',
    'https://www.tripadvisor.com/Restaurants-g644023-Buea_South_West_Region.html',
    'https://www.tripadvisor.com/Restaurants-g1202768-Limbe_South_West_Region.html',
  ];

  async function fetchAndParse(url: string): Promise<ParsedRestaurant[]> {
    const html = await fetchPage(url);
    const blocks = extractJsonLd(html);
    const items: ParsedRestaurant[] = [];

    for (const block of blocks) {
      const graph = (block as any)['@graph'];
      const itemList = (block as any).itemListElement;

      if (Array.isArray(graph)) {
        for (const node of graph) {
          if (
            node['@type'] === 'Restaurant' ||
            (Array.isArray(node['@type']) && node['@type'].includes('Restaurant'))
          ) {
            const r = toRestaurant(node, 'Cameroon');
            if (r) items.push(r);
          }
        }
      }

      if (Array.isArray(itemList)) {
        for (const el of itemList) {
          const item = (el as any).item ?? el;
          if (
            item &&
            (item['@type'] === 'Restaurant' ||
              (Array.isArray(item['@type']) && item['@type'].includes('Restaurant')))
          ) {
            const r = toRestaurant(item, 'Cameroon');
            if (r) items.push(r);
          }
        }
      }

      if ((block as any)['@type'] === 'Restaurant') {
        const r = toRestaurant(block, 'Cameroon');
        if (r) items.push(r);
      }
    }

    return items;
  }

  const allItems: ParsedRestaurant[] = [];
  const maxConcurrent = 2;
  for (let i = 0; i < DEFAULT_URLS.length; i += maxConcurrent) {
    const batch = DEFAULT_URLS.slice(i, i + maxConcurrent);
    const results = await Promise.all(
      batch.map(async (url) => {
        try {
          return await fetchAndParse(url);
        } catch (e: any) {
          console.log('[tRPC] Bootstrap import page fetch error', url, e?.message ?? e);
          return [];
        }
      })
    );
    results.forEach(items => allItems.push(...items));
  }

  const unique = new Map<string, ParsedRestaurant>();
  for (const it of allItems) {
    const key = it.name.trim().toLowerCase();
    if (!unique.has(key)) unique.set(key, it);
  }

  let restaurants = Array.from(unique.values());

  if (restaurants.length === 0) {
    const existing = await loadRestaurantsFromDb();
    if (existing.length > 0) {
      restaurants = existing;
    } else {
      restaurants = [
        { id: 'seed-la-chaumiere', name: 'La Chaumière', cuisine: 'French', rating: 4.4, reviewCount: 128, image: 'https://images.unsplash.com/photo-1528605248644-14dd04022da1?w=800&h=600&fit=crop', address: 'Douala, Cameroon', priceRange: '$$$' as const, isOpen: true, tags: ['French','Fine Dining'], verified: false, claimed: false },
        { id: 'seed-le-wagon', name: 'Le Wagon', cuisine: 'International', rating: 4.2, reviewCount: 96, image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&h=600&fit=crop', address: 'Yaoundé, Cameroon', priceRange: '$$' as const, isOpen: true, tags: ['Grill','Casual'], verified: false, claimed: false },
        { id: 'seed-aroma', name: 'Aroma', cuisine: 'Italian', rating: 4.5, reviewCount: 210, image: 'https://images.unsplash.com/photo-1543352634-8730b1b1c49b?w=800&h=600&fit=crop', address: 'Buea, Cameroon', priceRange: '$$' as const, isOpen: true, tags: ['Pizza','Pasta'], verified: false, claimed: false },
        { id: 'seed-sea-breeze', name: 'Sea Breeze', cuisine: 'Seafood', rating: 4.3, reviewCount: 142, image: 'https://images.unsplash.com/photo-1553621042-f6e147245754?w=800&h=600&fit=crop', address: 'Limbe, Cameroon', priceRange: '$$$' as const, isOpen: true, tags: ['Seafood','Coastal'], verified: false, claimed: false },
        { id: 'seed-green-garden', name: 'Green Garden', cuisine: 'Vegetarian', rating: 4.1, reviewCount: 88, image: 'https://images.unsplash.com/photo-1466637574441-749b8f19452f?w=800&h=600&fit=crop', address: 'Yaoundé, Cameroon', priceRange: '$$' as const, isOpen: true, tags: ['Vegan','Healthy'], verified: false, claimed: false },
        { id: 'seed-spice-route', name: 'Spice Route', cuisine: 'Indian', rating: 4.6, reviewCount: 176, image: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=800&h=600&fit=crop', address: 'Douala, Cameroon', priceRange: '$$' as const, isOpen: true, tags: ['Curry','Tandoori'], verified: false, claimed: false },
        { id: 'seed-sakura', name: 'Sakura', cuisine: 'Japanese', rating: 4.4, reviewCount: 132, image: 'https://images.unsplash.com/photo-1553621042-2d28fab91f7a?w=800&h=600&fit=crop', address: 'Douala, Cameroon', priceRange: '$$$' as const, isOpen: true, tags: ['Sushi','Ramen'], verified: false, claimed: false },
        { id: 'seed-bakery-bliss', name: 'Bakery Bliss', cuisine: 'Cafe', rating: 4.0, reviewCount: 64, image: 'https://images.unsplash.com/photo-1499636136210-6f4ee915583e?w=800&h=600&fit=crop', address: 'Buea, Cameroon', priceRange: '$' as const, isOpen: true, tags: ['Cafe','Dessert'], verified: false, claimed: false },
      ];
    }
  }

  await saveRestaurantsToDb(restaurants);
  cache.set('ONE_TIME_IMPORTED_RESTAURANTS', { data: restaurants, timestamp: Date.now() });

  console.log(`[tRPC] Bootstrap import completed: ${restaurants.length} restaurants saved`);
  return { success: true, imported: restaurants.length, restaurants, message: restaurants.length > 0 ? 'Bootstrap import completed' : 'No restaurants found' };
});