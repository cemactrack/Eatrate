import { z } from "zod";
import { publicProcedure } from "@/backend/trpc/create-context";

export const getPostFeedProcedure = publicProcedure
  .input(z.object({
    type: z.enum(['trending', 'recent', 'following', 'local']).default('recent'),
    category: z.enum(['all', 'review', 'photo', 'video', 'story']).default('all'),
    location: z.string().optional(),
    limit: z.number().min(1).max(50).default(20),
    cursor: z.string().optional(),
  }))
  .query(async ({ input }) => {
    // Add artificial delay to simulate network latency
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const offset = input.cursor ? parseInt(input.cursor) : 0;
    
    // Ensure we don't exceed reasonable limits
    const maxPosts = 1000;
    const actualLimit = Math.min(input.limit, 50);
    
    // Mock feed data
    const mockPosts = Array.from({ length: actualLimit }, (_, i) => {
      const postId = offset + i + 1;
      return {
        id: String(postId),
        userId: String((postId % 10) + 1),
        user: {
          id: String((postId % 10) + 1),
          username: `foodie_${(postId % 10) + 1}`,
          displayName: `Food Lover ${(postId % 10) + 1}`,
          avatar: `https://images.unsplash.com/photo-${1494790108755 + (postId % 10)}?w=200&h=200&fit=crop`,
          bio: 'Passionate about great food and experiences',
          followersCount: 100 + (postId % 1000),
          followingCount: 50 + (postId % 500),
          postsCount: 10 + (postId % 100),
          badges: postId % 5 === 0 ? ['Top Reviewer'] : [],
          preferences: { cuisines: ['Italian', 'Asian'], dietaryRestrictions: [], priceRange: ['$$', '$$$'] },
        },
        type: ['review', 'photo', 'video', 'story'][postId % 4] as 'review' | 'photo' | 'video' | 'story',
        content: {
          text: `Amazing food experience at this place! Post ${postId}. The flavors were incredible and the service was top-notch. Highly recommend trying their signature dishes.`,
          images: [
            `https://picsum.photos/seed/food${postId}/800/600`,
            ...(postId % 3 === 0 ? [`https://picsum.photos/seed/food${postId}b/800/600`] : []),
          ],
          videos: postId % 7 === 0 ? [`https://sample-videos.com/zip/10/mp4/SampleVideo_${postId % 3 + 1}280x720_1mb.mp4`] : [],
        },
        restaurant: postId % 2 === 0 ? {
          id: String((postId % 20) + 1),
          name: `Restaurant ${(postId % 20) + 1}`,
          location: ['Douala', 'Yaoundé', 'Buea', 'Limbe'][postId % 4],
        } : undefined,
        dish: postId % 3 === 0 ? {
          id: String((postId % 30) + 1),
          name: `Delicious Dish ${(postId % 30) + 1}`,
        } : undefined,
        ratings: {
          food: 3 + (postId % 3),
          service: 3 + ((postId + 1) % 3),
          ambiance: 3 + ((postId + 2) % 3),
          cleanliness: 4 + (postId % 2),
          overall: 3.5 + ((postId % 3) * 0.5),
        },
        tags: [
          'delicious',
          ['italian', 'asian', 'african', 'french'][postId % 4],
          ...(postId % 5 === 0 ? ['must-try', 'recommended'] : []),
        ],
        location: postId % 4 === 0 ? {
          latitude: 4.0511 + (postId % 100) * 0.001,
          longitude: 9.7679 + (postId % 100) * 0.001,
          address: `${postId} Food Street, Douala`,
        } : undefined,
        likesCount: 10 + (postId % 200),
        commentsCount: 2 + (postId % 50),
        sharesCount: 1 + (postId % 20),
        viewsCount: 50 + (postId % 500),
        isLiked: postId % 7 === 0,
        isBookmarked: postId % 11 === 0,
        createdAt: new Date(Date.now() - postId * 3600000).toISOString(),
        updatedAt: new Date(Date.now() - postId * 3600000).toISOString(),
      };
    });

    const hasMore = offset + actualLimit < maxPosts;
    const nextCursor = hasMore ? String(offset + actualLimit) : undefined;
    
    return {
      posts: mockPosts,
      total: maxPosts,
      hasMore,
      nextCursor,
      type: input.type,
      category: input.category,
    };
  });

export const getPostDetailsProcedure = publicProcedure
  .input(z.object({ postId: z.string() }))
  .query(async ({ input }) => {
    const postId = parseInt(input.postId) || 1;
    
    // Mock detailed post data
    const post = {
      id: input.postId,
      userId: String((postId % 10) + 1),
      user: {
        id: String((postId % 10) + 1),
        username: `foodie_${(postId % 10) + 1}`,
        displayName: `Food Lover ${(postId % 10) + 1}`,
        avatar: `https://images.unsplash.com/photo-${1494790108755 + (postId % 10)}?w=200&h=200&fit=crop`,
        bio: 'Passionate about great food and experiences. Love exploring new cuisines and sharing my discoveries!',
        followersCount: 1500 + (postId % 1000),
        followingCount: 250 + (postId % 500),
        postsCount: 45 + (postId % 100),
        badges: postId % 5 === 0 ? ['Top Reviewer', 'Local Guide'] : postId % 3 === 0 ? ['Verified Foodie'] : [],
        preferences: { 
          cuisines: ['Italian', 'Asian', 'African'], 
          dietaryRestrictions: postId % 7 === 0 ? ['Vegetarian'] : [], 
          priceRange: ['$$', '$$$'] 
        },
        isFollowing: postId % 6 === 0,
      },
      type: 'review' as const,
      content: {
        text: `Had an absolutely incredible dining experience here! Post ${postId}. The attention to detail in every dish was remarkable. The chef clearly knows how to balance flavors perfectly. The ambiance was cozy yet elegant, perfect for both casual dining and special occasions. Service was attentive without being intrusive. Will definitely be coming back soon! 

#foodie #restaurant #delicious #recommended`,
        images: [
          `https://picsum.photos/seed/food${postId}/800/600`,
          `https://picsum.photos/seed/food${postId}b/800/600`,
          `https://picsum.photos/seed/food${postId}c/800/600`,
        ],
        videos: postId % 5 === 0 ? [`https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4`] : [],
      },
      restaurant: {
        id: String((postId % 20) + 1),
        name: `Gourmet Restaurant ${(postId % 20) + 1}`,
        location: ['Douala Central', 'Yaoundé Downtown', 'Buea Town', 'Limbe Beach'][postId % 4],
      },
      dish: {
        id: String((postId % 30) + 1),
        name: `Signature Dish ${(postId % 30) + 1}`,
      },
      ratings: {
        food: 4 + (postId % 2),
        service: 4 + ((postId + 1) % 2),
        ambiance: 4 + ((postId + 2) % 2),
        cleanliness: 5,
        overall: 4.2 + ((postId % 3) * 0.3),
      },
      tags: [
        'amazing',
        'must-try',
        ['italian', 'asian', 'african', 'french'][postId % 4],
        'recommended',
        'fine-dining',
      ],
      location: {
        latitude: 4.0511 + (postId % 100) * 0.001,
        longitude: 9.7679 + (postId % 100) * 0.001,
        address: `${postId} Gourmet Street, Douala, Cameroon`,
      },
      likesCount: 125 + (postId % 200),
      commentsCount: 18 + (postId % 50),
      sharesCount: 8 + (postId % 20),
      viewsCount: 850 + (postId % 500),
      isLiked: postId % 7 === 0,
      isBookmarked: postId % 11 === 0,
      createdAt: new Date(Date.now() - postId * 3600000).toISOString(),
      updatedAt: new Date(Date.now() - postId * 3600000).toISOString(),
      
      // Additional details for post detail view
      engagement: {
        likesList: Array.from({ length: Math.min(10, 125 + (postId % 200)) }, (_, i) => ({
          id: String(i + 1),
          username: `user_${i + 1}`,
          displayName: `User ${i + 1}`,
          avatar: `https://images.unsplash.com/photo-${1494790108755 + i}?w=100&h=100&fit=crop`,
        })),
        topComments: Array.from({ length: Math.min(3, 18 + (postId % 50)) }, (_, i) => ({
          id: String(i + 1),
          user: {
            id: String(i + 1),
            username: `commenter_${i + 1}`,
            displayName: `Commenter ${i + 1}`,
            avatar: `https://images.unsplash.com/photo-${1494790108755 + i + 10}?w=100&h=100&fit=crop`,
          },
          text: `Great review! I've been wanting to try this place. Comment ${i + 1}`,
          likesCount: 5 + (i % 10),
          isLiked: i % 3 === 0,
          createdAt: new Date(Date.now() - (i + 1) * 1800000).toISOString(),
        })),
      },
      
      // Related posts
      relatedPosts: Array.from({ length: 3 }, (_, i) => ({
        id: String(postId + i + 100),
        user: {
          displayName: `Related User ${i + 1}`,
          avatar: `https://images.unsplash.com/photo-${1494790108755 + i + 20}?w=100&h=100&fit=crop`,
        },
        content: {
          text: `Related post ${i + 1} about similar cuisine...`,
          images: [`https://picsum.photos/seed/related${i}/400/300`],
        },
        ratings: { overall: 4 + (i % 2) },
        likesCount: 50 + (i * 10),
        createdAt: new Date(Date.now() - (i + 1) * 7200000).toISOString(),
      })),
    };

    return { post };
  });