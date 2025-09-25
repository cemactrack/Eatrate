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
    signal: AbortSignal.timeout(10000),
  });
  if (!res.ok) throw new Error(`Failed to fetch TripAdvisor: ${res.status}`);
  const text = await res.text();
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

    // Persist once locally for demo (no DB available). Store in memory cache for the process lifetime.
    cache.set('ONE_TIME_IMPORTED_RESTAURANTS', { data: restaurants, timestamp: Date.now() });

    return { success: true as const, imported: restaurants.length, restaurants };
  });

export function getOneTimeImportedRestaurants(): ParsedRestaurant[] {
  const cached = cache.get('ONE_TIME_IMPORTED_RESTAURANTS');
  return (cached?.data as ParsedRestaurant[]) ?? [];
}

export const getImportedOneTimeProcedure = publicProcedure.query(() => {
  const restaurants = getOneTimeImportedRestaurants();
  return { restaurants };
});
