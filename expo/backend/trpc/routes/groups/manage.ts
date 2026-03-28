import { z } from 'zod';
import { publicProcedure, protectedProcedure } from '@/backend/trpc/create-context';
import { FoodieGroup, GroupPost } from '@/types/restaurant';

// Mock data for foodie groups
const mockGroups: FoodieGroup[] = [
  {
    id: '1',
    name: 'Vegan Foodies Douala',
    description: 'Discover the best plant-based restaurants and dishes in Douala',
    image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd',
    category: 'dietary',
    memberCount: 245,
    isPrivate: false,
    adminId: 'admin1',
    admin: {
      id: 'admin1',
      username: 'veganfoodie',
      displayName: 'Sarah Green',
      avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786',
      bio: 'Plant-based food enthusiast',
      followersCount: 1200,
      followingCount: 300,
      postsCount: 150,
      badges: ['Vegan Expert', 'Community Leader'],
      preferences: {
        cuisines: ['Vegan', 'Mediterranean'],
        dietaryRestrictions: ['Vegan'],
        priceRange: ['$', '$$']
      }
    },
    isMember: false,
    createdAt: '2024-01-15',
    rules: [
      'Be respectful to all members',
      'Only share vegan-friendly content',
      'No spam or promotional posts',
      'Help others discover great vegan spots'
    ],
    tags: ['vegan', 'plant-based', 'healthy', 'douala']
  },
  {
    id: '2',
    name: 'Cameroon Street Food Lovers',
    description: 'Celebrating authentic Cameroonian street food culture',
    image: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1',
    category: 'cuisine',
    memberCount: 892,
    isPrivate: false,
    adminId: 'admin2',
    admin: {
      id: 'admin2',
      username: 'streetfoodking',
      displayName: 'Jean-Paul Mbeki',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d',
      bio: 'Street food connoisseur',
      followersCount: 2500,
      followingCount: 150,
      postsCount: 300,
      badges: ['Local Expert', 'Street Food Master'],
      preferences: {
        cuisines: ['African', 'Street Food'],
        dietaryRestrictions: [],
        priceRange: ['$']
      }
    },
    isMember: true,
    createdAt: '2023-11-20',
    rules: [
      'Focus on authentic Cameroonian street food',
      'Share locations and prices',
      'Respect local vendors',
      'No inappropriate content'
    ],
    tags: ['street-food', 'cameroon', 'local', 'authentic']
  },
  {
    id: '3',
    name: 'Fine Dining Yaounde',
    description: 'Exclusive group for fine dining enthusiasts in Yaounde',
    image: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0',
    category: 'location',
    memberCount: 156,
    isPrivate: true,
    adminId: 'admin3',
    admin: {
      id: 'admin3',
      username: 'finediningexpert',
      displayName: 'Marie Dubois',
      avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80',
      bio: 'Fine dining critic and sommelier',
      followersCount: 800,
      followingCount: 200,
      postsCount: 120,
      badges: ['Wine Expert', 'Fine Dining Critic'],
      preferences: {
        cuisines: ['French', 'Italian', 'Fine Dining'],
        dietaryRestrictions: [],
        priceRange: ['$$$', '$$$$']
      }
    },
    isMember: false,
    createdAt: '2024-02-01',
    rules: [
      'Members must have fine dining experience',
      'Share detailed reviews and photos',
      'Maintain high-quality discussions',
      'Respect restaurant staff and other diners'
    ],
    tags: ['fine-dining', 'yaounde', 'luxury', 'exclusive']
  }
];

const mockGroupPosts: GroupPost[] = [
  {
    id: '1',
    groupId: '1',
    group: mockGroups[0],
    userId: 'user1',
    user: {
      id: 'user1',
      username: 'plantlover',
      displayName: 'Emma Wilson',
      avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2',
      bio: 'Vegan food blogger',
      followersCount: 500,
      followingCount: 200,
      postsCount: 80,
      badges: ['Vegan Advocate'],
      preferences: {
        cuisines: ['Vegan'],
        dietaryRestrictions: ['Vegan'],
        priceRange: ['$', '$$']
      }
    },
    content: {
      text: 'Just discovered this amazing vegan burger at Green Garden Cafe! The patty is made from black beans and quinoa. Highly recommend! 🌱',
      images: ['https://images.unsplash.com/photo-1571091718767-18b5b1457add']
    },
    likesCount: 23,
    commentsCount: 8,
    isLiked: false,
    isPinned: false,
    createdAt: '2024-03-15T10:30:00Z'
  }
];

// Get all groups
export const getGroupsProcedure = publicProcedure
  .input(z.object({
    category: z.enum(['cuisine', 'dietary', 'location', 'interest']).optional(),
    city: z.string().optional(),
    search: z.string().optional(),
    limit: z.number().default(20),
    offset: z.number().default(0)
  }))
  .query(async ({ input }) => {
    console.log('[getGroups] Fetching groups with filters:', input);
    
    let filtered = [...mockGroups];
    
    if (input.category) {
      filtered = filtered.filter(group => group.category === input.category);
    }
    
    if (input.city) {
      filtered = filtered.filter(group => 
        group.tags.includes(input.city!.toLowerCase()) ||
        group.name.toLowerCase().includes(input.city!.toLowerCase())
      );
    }
    
    if (input.search) {
      const searchLower = input.search.toLowerCase();
      filtered = filtered.filter(group => 
        group.name.toLowerCase().includes(searchLower) ||
        group.description.toLowerCase().includes(searchLower) ||
        group.tags.some(tag => tag.includes(searchLower))
      );
    }
    
    // Sort by member count (most popular first)
    filtered.sort((a, b) => b.memberCount - a.memberCount);
    
    return {
      groups: filtered.slice(input.offset, input.offset + input.limit),
      total: filtered.length,
      hasMore: input.offset + input.limit < filtered.length
    };
  });

// Get group details
export const getGroupDetailsProcedure = publicProcedure
  .input(z.object({
    groupId: z.string()
  }))
  .query(async ({ input }) => {
    console.log('[getGroupDetails] Fetching group details:', input.groupId);
    
    const group = mockGroups.find(g => g.id === input.groupId);
    if (!group) {
      throw new Error('Group not found');
    }
    
    return group;
  });

// Join group
export const joinGroupProcedure = protectedProcedure
  .input(z.object({
    groupId: z.string()
  }))
  .mutation(async ({ input, ctx }) => {
    console.log('[joinGroup] User joining group:', input.groupId);
    
    const groupIndex = mockGroups.findIndex(g => g.id === input.groupId);
    if (groupIndex === -1) {
      throw new Error('Group not found');
    }
    
    const group = mockGroups[groupIndex];
    if (group.isPrivate) {
      return {
        success: false,
        message: 'This is a private group. Your request has been sent to the admin.',
        status: 'pending'
      };
    }
    
    // Update group membership
    mockGroups[groupIndex].memberCount += 1;
    mockGroups[groupIndex].isMember = true;
    
    return {
      success: true,
      message: `Successfully joined ${group.name}!`,
      status: 'joined'
    };
  });

// Leave group
export const leaveGroupProcedure = protectedProcedure
  .input(z.object({
    groupId: z.string()
  }))
  .mutation(async ({ input, ctx }) => {
    console.log('[leaveGroup] User leaving group:', input.groupId);
    
    const groupIndex = mockGroups.findIndex(g => g.id === input.groupId);
    if (groupIndex === -1) {
      throw new Error('Group not found');
    }
    
    // Update group membership
    mockGroups[groupIndex].memberCount = Math.max(0, mockGroups[groupIndex].memberCount - 1);
    mockGroups[groupIndex].isMember = false;
    
    return {
      success: true,
      message: 'Successfully left the group'
    };
  });

// Create group
export const createGroupProcedure = protectedProcedure
  .input(z.object({
    name: z.string().min(3).max(100),
    description: z.string().min(10).max(500),
    category: z.enum(['cuisine', 'dietary', 'location', 'interest']),
    isPrivate: z.boolean().default(false),
    rules: z.array(z.string()).max(10),
    tags: z.array(z.string()).max(10)
  }))
  .mutation(async ({ input, ctx }) => {
    console.log('[createGroup] Creating new group:', input.name);
    
    const newGroup: FoodieGroup = {
      id: Date.now().toString(),
      name: input.name,
      description: input.description,
      image: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0',
      category: input.category,
      memberCount: 1,
      isPrivate: input.isPrivate,
      adminId: ctx.user?.id || '',
      admin: {
        id: ctx.user?.id || '',
        username: (ctx.user as any)?.username || ctx.user?.email?.split('@')[0] || 'user',
        displayName: (ctx.user as any)?.displayName || ctx.user?.email?.split('@')[0] || 'User',
        avatar: (ctx.user as any)?.avatar || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e',
        bio: (ctx.user as any)?.bio || 'Group admin',
        followersCount: 0,
        followingCount: 0,
        postsCount: 0,
        badges: [],
        preferences: {
          cuisines: [],
          dietaryRestrictions: [],
          priceRange: []
        }
      },
      isMember: true,
      createdAt: new Date().toISOString(),
      rules: input.rules,
      tags: input.tags
    };
    
    mockGroups.push(newGroup);
    
    return {
      success: true,
      group: newGroup,
      message: 'Group created successfully!'
    };
  });

// Get group posts
export const getGroupPostsProcedure = publicProcedure
  .input(z.object({
    groupId: z.string(),
    limit: z.number().default(20),
    offset: z.number().default(0)
  }))
  .query(async ({ input }) => {
    console.log('[getGroupPosts] Fetching posts for group:', input.groupId);
    
    const filtered = mockGroupPosts.filter(post => post.groupId === input.groupId);
    
    // Sort by creation date (newest first)
    filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    
    return {
      posts: filtered.slice(input.offset, input.offset + input.limit),
      total: filtered.length,
      hasMore: input.offset + input.limit < filtered.length
    };
  });

// Create group post
export const createGroupPostProcedure = protectedProcedure
  .input(z.object({
    groupId: z.string(),
    text: z.string().optional(),
    images: z.array(z.string()).optional(),
    poll: z.object({
      question: z.string(),
      options: z.array(z.string()).min(2).max(4),
      expiresAt: z.string()
    }).optional()
  }))
  .mutation(async ({ input, ctx }) => {
    console.log('[createGroupPost] Creating post in group:', input.groupId);
    
    const group = mockGroups.find(g => g.id === input.groupId);
    if (!group) {
      throw new Error('Group not found');
    }
    
    if (!group.isMember) {
      throw new Error('You must be a member to post in this group');
    }
    
    const newPost: GroupPost = {
      id: Date.now().toString(),
      groupId: input.groupId,
      group,
      userId: ctx.user?.id || '',
      user: {
        id: ctx.user?.id || '',
        username: (ctx.user as any)?.username || ctx.user?.email?.split('@')[0] || 'user',
        displayName: (ctx.user as any)?.displayName || ctx.user?.email?.split('@')[0] || 'User',
        avatar: (ctx.user as any)?.avatar || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e',
        bio: (ctx.user as any)?.bio || 'App user',
        followersCount: 0,
        followingCount: 0,
        postsCount: 0,
        badges: [],
        preferences: {
          cuisines: [],
          dietaryRestrictions: [],
          priceRange: []
        }
      },
      content: {
        text: input.text,
        images: input.images,
        poll: input.poll ? {
          id: Date.now().toString(),
          userId: ctx.user?.id || '',
          user: {
            id: ctx.user?.id || '',
            username: (ctx.user as any)?.username || ctx.user?.email?.split('@')[0] || 'user',
            displayName: (ctx.user as any)?.displayName || ctx.user?.email?.split('@')[0] || 'User',
            avatar: (ctx.user as any)?.avatar || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e',
            bio: (ctx.user as any)?.bio || 'Poll creator',
            followersCount: 0,
            followingCount: 0,
            postsCount: 0,
            badges: [],
            preferences: {
              cuisines: [],
              dietaryRestrictions: [],
              priceRange: []
            }
          },
          question: input.poll.question,
          options: input.poll.options.map((option, index) => ({
            id: (index + 1).toString(),
            text: option,
            votes: 0,
            voters: []
          })),
          totalVotes: 0,
          expiresAt: input.poll.expiresAt,
          createdAt: new Date().toISOString(),
          hasVoted: false
        } : undefined
      },
      likesCount: 0,
      commentsCount: 0,
      isLiked: false,
      isPinned: false,
      createdAt: new Date().toISOString()
    };
    
    mockGroupPosts.push(newPost);
    
    return {
      success: true,
      post: newPost,
      message: 'Post created successfully!'
    };
  });

// Get user's groups
export const getUserGroupsProcedure = protectedProcedure
  .query(async ({ ctx }) => {
    console.log('[getUserGroups] Fetching groups for user:', ctx.user?.id);
    
    // Mock implementation - return groups where user is a member
    const userGroups = mockGroups.filter(group => group.isMember);
    
    return {
      groups: userGroups,
      total: userGroups.length
    };
  });