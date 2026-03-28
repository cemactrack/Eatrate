import { z } from 'zod';
import { publicProcedure, protectedProcedure } from '@/backend/trpc/create-context';


// Mock support data
const mockFAQs = [
  {
    id: '1',
    question: 'How do I claim my restaurant?',
    answer: 'To claim your restaurant, go to the restaurant page and tap "Claim This Restaurant". You will need to provide verification documents like business license or utility bills.',
    category: 'restaurant-owners',
    tags: ['claim', 'verification', 'restaurant'],
  },
  {
    id: '2',
    question: 'How do I reset my password?',
    answer: 'Go to the login screen and tap "Forgot Password". Enter your email address and we will send you a reset link.',
    category: 'account',
    tags: ['password', 'reset', 'login'],
  },
  {
    id: '3',
    question: 'How do I report inappropriate content?',
    answer: 'Tap the three dots menu on any post or review and select "Report". Choose the reason for reporting and we will review it within 24 hours.',
    category: 'safety',
    tags: ['report', 'content', 'moderation'],
  },
  {
    id: '4',
    question: 'How does the photo search work?',
    answer: 'Take a photo of food or upload from your gallery. The app will suggest restaurants that serve similar food based on visual patterns.',
    category: 'features',
    tags: ['photo', 'search'],
  },
  {
    id: '5',
    question: 'How do I make a reservation?',
    answer: 'Go to a restaurant page and tap "Make Reservation". Select your preferred date, time, and party size. Some restaurants require confirmation.',
    category: 'reservations',
    tags: ['reservation', 'booking', 'restaurant'],
  },
];

const mockSupportTickets = [
  {
    id: 'ticket-1',
    userId: 'user1',
    subject: 'Cannot claim my restaurant',
    message: 'I have been trying to claim my restaurant but the verification keeps failing.',
    status: 'open' as const,
    priority: 'medium' as 'low' | 'medium' | 'high',
    category: 'restaurant-owners',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
    updatedAt: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
    responses: [
      {
        id: 'response-1',
        message: 'Hi! I am sorry to hear you are having trouble. Can you please tell me what error message you are seeing?',
        isFromSupport: true,
        createdAt: new Date(Date.now() - 1000 * 60 * 30),
      },
    ],
  },
];

// Get FAQs
export const getFAQsProcedure = publicProcedure
  .input(
    z.object({
      category: z.string().optional(),
      search: z.string().optional(),
      limit: z.number().min(1).max(50).default(20),
    })
  )
  .query(async ({ input }) => {
    console.log('[tRPC] Getting FAQs:', input);
    
    let filteredFAQs = [...mockFAQs];
    
    // Filter by category
    if (input.category && input.category !== 'all') {
      filteredFAQs = filteredFAQs.filter(faq => faq.category === input.category);
    }
    
    // Filter by search query
    if (input.search) {
      const searchLower = input.search.toLowerCase();
      filteredFAQs = filteredFAQs.filter(faq => 
        faq.question.toLowerCase().includes(searchLower) ||
        faq.answer.toLowerCase().includes(searchLower) ||
        faq.tags.some(tag => tag.toLowerCase().includes(searchLower))
      );
    }
    
    // Apply limit
    const limitedFAQs = filteredFAQs.slice(0, input.limit);
    
    // Get available categories
    const categories = Array.from(new Set(mockFAQs.map(faq => faq.category)));
    
    return {
      faqs: limitedFAQs,
      categories: ['all', ...categories],
      total: filteredFAQs.length,
    };
  });

// Create support ticket
export const createSupportTicketProcedure = protectedProcedure
  .input(
    z.object({
      subject: z.string().min(1).max(200),
      message: z.string().min(1).max(2000),
      category: z.string(),
      priority: z.enum(['low', 'medium', 'high']).default('medium'),
    })
  )
  .mutation(async ({ input, ctx }) => {
    console.log('[tRPC] Creating support ticket:', input);
    
    const newTicket = {
      id: `ticket-${Date.now()}`,
      userId: ctx.user.id,
      subject: input.subject,
      message: input.message,
      status: 'open' as const,
      priority: input.priority,
      category: input.category,
      createdAt: new Date(),
      updatedAt: new Date(),
      responses: [],
    };
    
    mockSupportTickets.push(newTicket);
    
    return {
      success: true,
      ticket: newTicket,
    };
  });

// Get user's support tickets
export const getUserTicketsProcedure = protectedProcedure
  .input(
    z.object({
      status: z.enum(['all', 'open', 'closed']).default('all'),
      limit: z.number().min(1).max(50).default(20),
    })
  )
  .query(async ({ input, ctx }) => {
    console.log('[tRPC] Getting user tickets:', input);
    
    let userTickets = mockSupportTickets.filter(ticket => ticket.userId === ctx.user.id);
    
    // Filter by status
    if (input.status !== 'all') {
      userTickets = userTickets.filter(ticket => ticket.status === input.status);
    }
    
    // Sort by most recent
    userTickets.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
    
    // Apply limit
    const limitedTickets = userTickets.slice(0, input.limit);
    
    return {
      tickets: limitedTickets,
      total: userTickets.length,
    };
  });

// Add response to ticket
export const addTicketResponseProcedure = protectedProcedure
  .input(
    z.object({
      ticketId: z.string(),
      message: z.string().min(1).max(2000),
    })
  )
  .mutation(async ({ input, ctx }) => {
    console.log('[tRPC] Adding ticket response:', input);
    
    const ticket = mockSupportTickets.find(t => t.id === input.ticketId && t.userId === ctx.user.id);
    
    if (!ticket) {
      throw new Error('Ticket not found');
    }
    
    const newResponse = {
      id: `response-${Date.now()}`,
      message: input.message,
      isFromSupport: false,
      createdAt: new Date(),
    };
    
    ticket.responses.push(newResponse);
    ticket.updatedAt = new Date();
    ticket.status = 'open'; // Reopen if closed
    
    return {
      success: true,
      response: newResponse,
    };
  });

// Automated support chat
export const chatWithSupportProcedure = protectedProcedure
  .input(
    z.object({
      message: z.string().min(1).max(1000),
      conversationId: z.string().optional(),
    })
  )
  .mutation(async ({ input, ctx }) => {
    console.log('[tRPC] Support chat:', input);
    
    try {
      // Simple automated responses for common queries
      const message = input.message.toLowerCase();
      let response = "Thank you for contacting EatRate support. ";
      
      if (message.includes('login') || message.includes('password')) {
        response += "For login issues, please try resetting your password using the 'Forgot Password' link on the login screen. If the problem persists, please create a support ticket.";
      } else if (message.includes('claim') || message.includes('restaurant')) {
        response += "To claim your restaurant, visit the restaurant page and tap 'Claim This Restaurant'. You'll need to provide verification documents. Check our FAQ for detailed steps.";
      } else if (message.includes('photo') || message.includes('search')) {
        response += "Photo search allows you to upload food images to find similar restaurants. Make sure your photo is clear and well-lit for best results.";
      } else if (message.includes('reservation') || message.includes('booking')) {
        response += "To make a reservation, go to the restaurant page and tap 'Make Reservation'. Select your preferred date, time, and party size.";
      } else {
        response += "I'd be happy to help you with your question. For personalized assistance, please create a support ticket and our team will get back to you within 24 hours.";
      }
      
      return {
        success: true,
        response,
        conversationId: input.conversationId || `conv-${Date.now()}`,
      };
      
    } catch (error) {
      console.error('[tRPC] Support chat failed:', error);
      
      // Fallback response
      return {
        success: true,
        response: "I'm sorry, I'm having trouble processing your request right now. Please try again or create a support ticket for personalized help.",
        conversationId: input.conversationId || `conv-${Date.now()}`,
      };
    }
  });

// Get support categories
export const getSupportCategoriesProcedure = publicProcedure
  .query(async () => {
    return {
      categories: [
        {
          id: 'account',
          name: 'Account & Login',
          description: 'Password resets, account settings, profile issues',
          icon: 'user',
        },
        {
          id: 'restaurant-owners',
          name: 'Restaurant Owners',
          description: 'Claiming restaurants, menu management, verification',
          icon: 'store',
        },
        {
          id: 'features',
          name: 'App Features',
          description: 'How to use photo search, reservations, and other features',
          icon: 'help-circle',
        },
        {
          id: 'reservations',
          name: 'Reservations',
          description: 'Booking tables, cancellations, confirmation issues',
          icon: 'calendar',
        },
        {
          id: 'safety',
          name: 'Safety & Reporting',
          description: 'Report content, safety concerns, community guidelines',
          icon: 'shield',
        },
        {
          id: 'technical',
          name: 'Technical Issues',
          description: 'App crashes, bugs, performance problems',
          icon: 'settings',
        },
        {
          id: 'other',
          name: 'Other',
          description: 'General questions and feedback',
          icon: 'message-circle',
        },
      ],
    };
  });