import { z } from "zod";
import { publicProcedure } from "@/backend/trpc/create-context";

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

function toRestaurant(item: any): ParsedRestaurant | null {
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
      : firstString(addressObj ?? 'Yaoundé, Cameroon');

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
      address: address || 'Yaoundé, Cameroon',
      priceRange,
      isOpen: true,
      tags,
    };

    return restaurant;
  } catch (e) {
    console.log('[yaounde.parse] error converting item', e);
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
        console.log('[yaounde.jsonld] parse failure, skipping block');
      }
    }
  }
  return results;
}

// Simple in-memory cache
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 1000 * 60 * 30; // 30 minutes

async function fetchPage(url: string): Promise<string> {
  const cacheKey = `page_${url}`;
  const cached = cache.get(cacheKey);
  
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }
  
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; EatRateBot/1.0; +https://example.com) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123 Safari/537.36',
      'Accept-Language': 'en-US,en;q=0.9',
    },
    signal: AbortSignal.timeout(8000), // 8 second timeout
  });
  
  if (!res.ok) throw new Error(`Failed to fetch TripAdvisor: ${res.status}`);
  
  const text = await res.text();
  cache.set(cacheKey, { data: text, timestamp: Date.now() });
  
  return text;
}

export const fetchYaoundeRestaurantsProcedure = publicProcedure
  .input(
    z
      .object({
        page: z.number().min(1).max(10).optional(),
        pages: z.array(z.number().min(1).max(10)).optional(),
        urls: z.array(z.string().url()).optional(),
      })
      .optional(),
  )
  .query(async ({ input }) => {
    const baseUrl = 'https://www.tripadvisor.com/Restaurants-g293773-Yaounde_Centre_Region.html';

    function pageToUrl(p: number): string {
      const offset = (p - 1) * 30;
      if (offset <= 0) return baseUrl;
      return `https://www.tripadvisor.com/Restaurants-g293773-oa${offset}-Yaounde_Centre_Region.html`;
    }

    const targetUrls: string[] = [];

    if (input?.urls?.length) {
      for (const u of input.urls) targetUrls.push(u);
    } else if (input?.pages?.length) {
      for (const p of input.pages) targetUrls.push(pageToUrl(p));
    } else {
      const p = input?.page ?? 1;
      targetUrls.push(pageToUrl(p));
    }

    console.log('[tRPC] Fetch Yaoundé restaurants', { targetUrls });

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
              const r = toRestaurant(node);
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
              const r = toRestaurant(item);
              if (r) items.push(r);
            }
          }
        }

        if ((block as any)['@type'] === 'Restaurant') {
          const r = toRestaurant(block);
          if (r) items.push(r);
        }
      }

      return items;
    }

    try {
      // Check cache first
      const cacheKey = `restaurants_${JSON.stringify(targetUrls)}`;
      const cached = cache.get(cacheKey);
      
      if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        return cached.data;
      }
      
      const allItems: ParsedRestaurant[] = [];
      
      // Limit concurrent requests to avoid overwhelming the server
      const maxConcurrent = 2;
      for (let i = 0; i < targetUrls.length; i += maxConcurrent) {
        const batch = targetUrls.slice(i, i + maxConcurrent);
        const promises = batch.map(async (url) => {
          try {
            return await fetchAndParse(url);
          } catch (e: any) {
            console.log('[tRPC] Page fetch error', url, e?.message ?? e);
            return [];
          }
        });
        
        const results = await Promise.all(promises);
        results.forEach(items => allItems.push(...items));
      }

      const unique = new Map<string, ParsedRestaurant>();
      for (const it of allItems) {
        const key = it.name.trim().toLowerCase();
        if (!unique.has(key)) unique.set(key, it);
      }

      const restaurants = Array.from(unique.values());
      const result = { restaurants, source: 'tripadvisor', count: restaurants.length, pagesFetched: targetUrls.length };
      
      // Cache the result
      cache.set(cacheKey, { data: result, timestamp: Date.now() });
      
      return result;
    } catch (error: any) {
      console.error('[tRPC] TripAdvisor fetch failed', error?.message ?? error);
      return {
        restaurants: [] as ParsedRestaurant[],
        source: 'error',
        count: 0,
        error: String(error?.message ?? 'Unknown error'),
      };
    }
  });