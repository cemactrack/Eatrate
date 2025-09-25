import { z } from 'zod';
import { publicProcedure, protectedProcedure } from '@/backend/trpc/create-context';
import type { QRMenu } from '@/types/restaurant';

const mockQRMenus: QRMenu[] = [
  {
    id: '1',
    restaurantId: 'rest1',
    qrCode: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2ZmZiIvPgogIDx0ZXh0IHg9IjEwMCIgeT0iMTAwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSIgZm9udC1mYW1pbHk9Im1vbm9zcGFjZSIgZm9udC1zaXplPSIxNCI+UVIgTWVudTwvdGV4dD4KPC9zdmc+',
    menuUrl: 'https://eatrate.app/menu/rest1',
    isActive: true,
    scansCount: 245,
    createdAt: '2024-01-01T00:00:00Z'
  },
  {
    id: '2',
    restaurantId: 'rest2',
    qrCode: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2ZmZiIvPgogIDx0ZXh0IHg9IjEwMCIgeT0iMTAwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSIgZm9udC1mYW1pbHk9Im1vbm9zcGFjZSIgZm9udC1zaXplPSIxNCI+UVIgTWVudTwvdGV4dD4KPC9zdmc+',
    menuUrl: 'https://eatrate.app/menu/rest2',
    isActive: true,
    scansCount: 156,
    createdAt: '2024-01-05T00:00:00Z'
  }
];

export const getQRMenuProcedure = publicProcedure
  .input(z.object({
    restaurantId: z.string()
  }))
  .query(async ({ input }) => {
    console.log('📱 Fetching QR menu:', input.restaurantId);
    
    const qrMenu = mockQRMenus.find(qr => qr.restaurantId === input.restaurantId);
    
    if (!qrMenu) {
      throw new Error('QR menu not found for this restaurant');
    }
    
    return {
      qrMenu,
      menuUrl: qrMenu.menuUrl,
      reviewPrompt: `Enjoyed your meal at this restaurant? Leave a review on EatRate!`
    };
  });

export const generateQRMenuProcedure = protectedProcedure
  .input(z.object({
    restaurantId: z.string(),
    includeReviewPrompt: z.boolean().optional().default(true),
    customMessage: z.string().optional()
  }))
  .mutation(async ({ input }) => {
    console.log('🔄 Generating QR menu:', input);
    
    // Simulate QR code generation
    const qrCodeData = `data:image/svg+xml;base64,${Buffer.from(`
      <svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
        <rect width="200" height="200" fill="#fff"/>
        <text x="100" y="100" text-anchor="middle" dy=".3em" font-family="monospace" font-size="14">QR Menu</text>
      </svg>
    `).toString('base64')}`;
    
    const menuUrl = `https://eatrate.app/menu/${input.restaurantId}`;
    
    const newQRMenu: QRMenu = {
      id: `qr_${Date.now()}`,
      restaurantId: input.restaurantId,
      qrCode: qrCodeData,
      menuUrl,
      isActive: true,
      scansCount: 0,
      createdAt: new Date().toISOString()
    };
    
    // Update or add to mock data
    const existingIndex = mockQRMenus.findIndex(qr => qr.restaurantId === input.restaurantId);
    if (existingIndex >= 0) {
      mockQRMenus[existingIndex] = newQRMenu;
    } else {
      mockQRMenus.push(newQRMenu);
    }
    
    return {
      qrMenu: newQRMenu,
      downloadUrl: qrCodeData,
      printableUrl: `${menuUrl}?print=true`,
      message: 'QR menu generated successfully!'
    };
  });

export const trackQRScanProcedure = publicProcedure
  .input(z.object({
    qrMenuId: z.string(),
    userAgent: z.string().optional(),
    location: z.object({
      latitude: z.number(),
      longitude: z.number()
    }).optional()
  }))
  .mutation(async ({ input }) => {
    console.log('📊 Tracking QR scan:', input);
    
    const qrMenu = mockQRMenus.find(qr => qr.id === input.qrMenuId);
    
    if (qrMenu) {
      qrMenu.scansCount += 1;
    }
    
    return {
      success: true,
      message: 'Scan tracked successfully',
      showReviewPrompt: true,
      reviewPromptDelay: 30000 // Show review prompt after 30 seconds
    };
  });

export const getQRAnalyticsProcedure = protectedProcedure
  .input(z.object({
    restaurantId: z.string(),
    period: z.enum(['day', 'week', 'month', 'year']).optional().default('month')
  }))
  .query(async ({ input }) => {
    console.log('📈 Fetching QR analytics:', input);
    
    const qrMenu = mockQRMenus.find(qr => qr.restaurantId === input.restaurantId);
    
    if (!qrMenu) {
      return {
        totalScans: 0,
        periodScans: 0,
        averageScansPerDay: 0,
        peakHours: [],
        deviceBreakdown: { mobile: 0, tablet: 0, desktop: 0 },
        locationData: []
      };
    }
    
    // Mock analytics data
    return {
      totalScans: qrMenu.scansCount,
      periodScans: Math.floor(qrMenu.scansCount * 0.3),
      averageScansPerDay: Math.floor(qrMenu.scansCount / 30),
      peakHours: [
        { hour: 12, scans: 45 },
        { hour: 13, scans: 52 },
        { hour: 19, scans: 38 },
        { hour: 20, scans: 41 }
      ],
      deviceBreakdown: {
        mobile: Math.floor(qrMenu.scansCount * 0.8),
        tablet: Math.floor(qrMenu.scansCount * 0.15),
        desktop: Math.floor(qrMenu.scansCount * 0.05)
      },
      locationData: [
        { area: 'Table 1-5', scans: 45 },
        { area: 'Table 6-10', scans: 38 },
        { area: 'Bar Area', scans: 22 },
        { area: 'Outdoor', scans: 15 }
      ]
    };
  });

export const updateQRMenuStatusProcedure = protectedProcedure
  .input(z.object({
    qrMenuId: z.string(),
    isActive: z.boolean()
  }))
  .mutation(async ({ input }) => {
    console.log('🔄 Updating QR menu status:', input);
    
    const qrMenu = mockQRMenus.find(qr => qr.id === input.qrMenuId);
    
    if (!qrMenu) {
      throw new Error('QR menu not found');
    }
    
    qrMenu.isActive = input.isActive;
    
    return {
      qrMenu,
      message: `QR menu ${input.isActive ? 'activated' : 'deactivated'} successfully`
    };
  });