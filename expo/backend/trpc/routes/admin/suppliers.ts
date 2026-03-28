import { z } from 'zod';
import { publicProcedure } from '../../create-context';

interface AdminSupplier {
  id: string;
  name: string;
  description: string;
  logo: string;
  location: string;
  phone: string;
  email: string;
  website?: string;
  categories: string[];
  productsCount: number;
  status: 'active' | 'pending' | 'suspended';
  createdAt: string;
  updatedAt: string;
}

export const getAdminSuppliersProcedure = publicProcedure
  .input(z.object({
    search: z.string().optional(),
    status: z.enum(['all', 'active', 'pending', 'suspended']).default('all'),
    limit: z.number().min(1).max(100).default(20),
    offset: z.number().min(0).default(0),
  }))
  .query(async ({ input }) => {
    // Mock data - replace with real database queries
    const suppliers: AdminSupplier[] = [
      {
        id: '1',
        name: 'Fresh Farm Produce',
        description: 'Premium organic vegetables and fruits sourced directly from local farms',
        logo: 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=200&h=200&fit=crop',
        location: 'Douala, Cameroon',
        phone: '+237 123 456 789',
        email: 'contact@freshfarm.cm',
        website: 'https://freshfarm.cm',
        categories: ['Vegetables', 'Fruits', 'Organic'],
        productsCount: 150,
        status: 'active',
        createdAt: '2023-01-15T10:30:00Z',
        updatedAt: '2024-01-20T15:45:00Z',
      },
      {
        id: '2',
        name: 'Ocean Seafood Co.',
        description: 'Fresh seafood and fish products from the Atlantic coast',
        logo: 'https://images.unsplash.com/photo-1544943910-4c1dc44aab44?w=200&h=200&fit=crop',
        location: 'Limbe, Cameroon',
        phone: '+237 987 654 321',
        email: 'info@oceanseafood.cm',
        categories: ['Seafood', 'Fish', 'Frozen'],
        productsCount: 85,
        status: 'pending',
        createdAt: '2023-06-20T14:20:00Z',
        updatedAt: '2024-01-18T09:30:00Z',
      },
      {
        id: '3',
        name: 'Spice Masters',
        description: 'Traditional African spices and seasonings',
        logo: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=200&h=200&fit=crop',
        location: 'Yaounde, Cameroon',
        phone: '+237 555 123 456',
        email: 'orders@spicemasters.cm',
        categories: ['Spices', 'Seasonings', 'Traditional'],
        productsCount: 45,
        status: 'suspended',
        createdAt: '2023-03-10T11:15:00Z',
        updatedAt: '2024-01-15T16:20:00Z',
      },
    ];

    let filtered = suppliers;
    
    if (input.search) {
      const searchLower = input.search.toLowerCase();
      filtered = filtered.filter(s => 
        s.name.toLowerCase().includes(searchLower) ||
        s.description.toLowerCase().includes(searchLower) ||
        s.location.toLowerCase().includes(searchLower) ||
        s.categories.some(cat => cat.toLowerCase().includes(searchLower))
      );
    }

    if (input.status !== 'all') {
      filtered = filtered.filter(s => s.status === input.status);
    }

    return {
      suppliers: filtered.slice(input.offset, input.offset + input.limit),
      total: filtered.length,
      hasMore: input.offset + input.limit < filtered.length,
    };
  });

export const updateSupplierStatusProcedure = publicProcedure
  .input(z.object({
    supplierId: z.string(),
    status: z.enum(['active', 'pending', 'suspended']),
    reason: z.string().optional(),
  }))
  .mutation(async ({ input }) => {
    console.log(`Updating supplier ${input.supplierId} status to ${input.status}`, input.reason);
    return { success: true };
  });

export const deleteSupplierProcedure = publicProcedure
  .input(z.object({
    supplierId: z.string(),
    reason: z.string(),
  }))
  .mutation(async ({ input }) => {
    console.log(`Deleting supplier ${input.supplierId}:`, input.reason);
    return { success: true };
  });

export const getSupplierDetailsProcedure = publicProcedure
  .input(z.object({
    supplierId: z.string(),
  }))
  .query(async ({ input }) => {
    // Mock data - replace with real database query
    return {
      id: input.supplierId,
      name: 'Fresh Farm Produce',
      description: 'Premium organic vegetables and fruits sourced directly from local farms',
      logo: 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=200&h=200&fit=crop',
      location: 'Douala, Cameroon',
      phone: '+237 123 456 789',
      email: 'contact@freshfarm.cm',
      website: 'https://freshfarm.cm',
      categories: ['Vegetables', 'Fruits', 'Organic'],
      productsCount: 150,
      status: 'active' as const,
      owner: {
        id: 'owner_1',
        name: 'Jean Mballa',
        email: 'jean@freshfarm.cm',
        phone: '+237 123 456 789',
      },
      stats: {
        totalOrders: 850,
        totalRevenue: 125000,
        avgOrderValue: 147,
        topProducts: ['Tomatoes', 'Onions', 'Plantains'],
      },
      createdAt: '2023-01-15T10:30:00Z',
      updatedAt: '2024-01-20T15:45:00Z',
    };
  });