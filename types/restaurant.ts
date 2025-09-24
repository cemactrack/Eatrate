export interface Restaurant {
  id: string;
  name: string;
  cuisine: string;
  rating: number;
  reviewCount: number;
  image: string;
  address: string;
  priceRange: '$' | '$$' | '$$$' | '$$$$';
  distance?: string;
  isOpen: boolean;
  tags: string[];
  followersCount?: number;
}

export interface Dish {
  id: string;
  name: string;
  restaurant: string;
  rating: number;
  reviewCount: number;
  image: string;
  price: number;
  description: string;
  category: string;
  tags: string[];
}

export interface Review {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  rating: number;
  comment: string;
  date: string;
  images?: string[];
}

export interface User {
  id: string;
  username: string;
  displayName: string;
  avatar: string;
  bio?: string;
  followersCount: number;
  followingCount: number;
  postsCount: number;
  badges: string[];
  isFollowing?: boolean;
  preferences: {
    cuisines: string[];
    dietaryRestrictions: string[];
    priceRange: string[];
  };
}

export interface Post {
  id: string;
  userId: string;
  user: User;
  type: 'review' | 'photo' | 'video' | 'story';
  content: {
    text?: string;
    images?: string[];
    video?: string;
  };
  restaurant?: {
    id: string;
    name: string;
    location: string;
  };
  dish?: {
    id: string;
    name: string;
  };
  ratings?: {
    food: number;
    service: number;
    ambiance: number;
    cleanliness: number;
    overall: number;
  };
  tags: string[];
  location?: {
    latitude: number;
    longitude: number;
    address: string;
  };
  likesCount: number;
  commentsCount: number;
  sharesCount: number;
  viewsCount?: number;
  isLiked: boolean;
  isBookmarked?: boolean;
  createdAt: string;
  updatedAt?: string;
  scheduledFor?: string;
  isDraft?: boolean;
  status?: 'draft' | 'scheduled' | 'published';
}

export interface Comment {
  id: string;
  postId: string;
  userId: string;
  user: User;
  text: string;
  likesCount: number;
  isLiked: boolean;
  createdAt: string;
  replies?: Comment[];
}

export interface Story {
  id: string;
  userId: string;
  user: User;
  content: {
    image?: string;
    video?: string;
    text?: string;
  };
  restaurant?: {
    id: string;
    name: string;
  };
  isViewed: boolean;
  expiresAt: string;
  createdAt: string;
}
