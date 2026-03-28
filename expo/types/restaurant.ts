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
  // Enhanced fields for missing features
  sponsored?: boolean;
  premiumListing?: boolean;
  emergencyContact?: string;
  complianceInfo?: {
    licenseNumber?: string;
    healthRating?: string;
    lastInspection?: Date;
  };
  insights?: RestaurantInsights;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  verified: boolean;
  claimed: boolean;
  ownerId?: string;
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
  // Enhanced fields for missing features
  allergens?: string[];
  dietaryTags?: string[];
  nutritionInfo?: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
  trendingScore?: number;
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
  verified?: boolean;
  helpfulVotes?: number;
  isHelpful?: boolean;
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
  // Enhanced fields for missing features
  reputation?: UserReputation;
  subscription?: PremiumSubscription;
  rewards?: Reward[];
}



export interface Post {
  id: string;
  userId: string;
  user: User;
  type: 'review' | 'photo' | 'video' | 'story';
  content: {
    text?: string;
    images?: string[];
    videos?: string[];
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

export interface FeedResponse {
  posts: Post[];
  total: number;
  hasMore: boolean;
  nextCursor?: string;
  type: string;
  category: string;
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

export interface Bookmark {
  id: string;
  userId: string;
  type: 'restaurant' | 'dish' | 'post';
  itemId: string;
  item: Restaurant | Dish | Post;
  createdAt: string;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'reviews' | 'social' | 'discovery' | 'special';
  requirement: number;
  points: number;
  unlockedAt?: string;
}

export interface UserStats {
  totalReviews: number;
  totalLikes: number;
  totalFollowers: number;
  totalFollowing: number;
  totalPosts: number;
  totalBookmarks: number;
  joinedDate: string;
  level: number;
  points: number;
  achievements: Achievement[];
}

export interface Poll {
  id: string;
  userId: string;
  user: User;
  question: string;
  options: {
    id: string;
    text: string;
    votes: number;
    voters: string[];
  }[];
  totalVotes: number;
  expiresAt: string;
  createdAt: string;
  hasVoted: boolean;
  userVote?: string;
}

export interface FoodChallenge {
  id: string;
  title: string;
  description: string;
  image: string;
  category: string;
  difficulty: 'easy' | 'medium' | 'hard';
  participants: number;
  prize?: string;
  startDate: string;
  endDate: string;
  rules: string[];
  isActive: boolean;
  hasParticipated: boolean;
}

export interface Event {
  id: string;
  title: string;
  description: string;
  image: string;
  type: 'food_fair' | 'restaurant_week' | 'popup' | 'festival';
  venue: {
    name: string;
    address: string;
    latitude: number;
    longitude: number;
  };
  startDate: string;
  endDate: string;
  price?: {
    min: number;
    max: number;
    currency: string;
  };
  attendees: number;
  maxAttendees?: number;
  isAttending: boolean;
  organizer: {
    id: string;
    name: string;
    avatar: string;
  };
}

export interface Supplier {
  id: string;
  name: string;
  description: string;
  image: string;
  category: 'vegetables' | 'fruits' | 'meat' | 'seafood' | 'dairy' | 'grains' | 'spices';
  location: {
    address: string;
    city: string;
    latitude: number;
    longitude: number;
  };
  contact: {
    phone?: string;
    email?: string;
    website?: string;
  };
  rating: number;
  reviewCount: number;
  isVerified: boolean;
  // deliveryAreas removed
  minimumOrder?: number;
  // deliveryFee removed
  operatingHours: {
    [key: string]: {
      open: string;
      close: string;
      isOpen: boolean;
    };
  };
}

export interface MenuCategory {
  id: string;
  name: string;
  description?: string;
  dishes: Dish[];
}

export interface RestaurantMenu {
  id: string;
  restaurantId: string;
  categories: MenuCategory[];
  lastUpdated: string;
}

export interface Reservation {
  id: string;
  userId: string;
  restaurantId: string;
  restaurant: Restaurant;
  date: string;
  time: string;
  partySize: number;
  specialRequests?: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  confirmationCode: string;
  createdAt: string;
}

export interface QRMenu {
  id: string;
  restaurantId: string;
  qrCode: string;
  menuUrl: string;
  isActive: boolean;
  scansCount: number;
  createdAt: string;
}

export interface RestaurantInsights {
  restaurantId: string;
  period: 'day' | 'week' | 'month' | 'year';
  views: number;
  reviews: number;
  averageRating: number;
  bookmarks: number;
  menuViews: number;
  qrScans: number;
  topDishes: {
    dish: Dish;
    orders: number;
    rating: number;
  }[];
  customerDemographics: {
    ageGroups: { [key: string]: number };
    locations: { [key: string]: number };
  };
  peakHours: { [key: string]: number };
  reviewSentiment: {
    positive: number;
    neutral: number;
    negative: number;
  };
}

export interface Notification {
  id: string;
  userId: string;
  type: 'like' | 'comment' | 'follow' | 'mention' | 'reservation' | 'achievement' | 'system';
  title: string;
  message: string;
  data?: any;
  isRead: boolean;
  createdAt: string;
  actionUrl?: string;
}

export interface AppSettings {
  theme: 'light' | 'dark' | 'system';
  language: 'en' | 'fr';
  notifications: {
    push: boolean;
    email: boolean;
    likes: boolean;
    comments: boolean;
    follows: boolean;
    mentions: boolean;
    reservations: boolean;
    achievements: boolean;
    marketing: boolean;
  };
  privacy: {
    profileVisibility: 'public' | 'friends' | 'private';
    showLocation: boolean;
    showActivity: boolean;
  };
  preferences: {
    defaultCity: string;
    cuisinePreferences: string[];
    dietaryRestrictions: string[];
    priceRange: string[];
    distance: number;
  };
}

// Premium & Monetization Types
export interface PremiumSubscription {
  id: string;
  userId: string;
  plan: 'basic' | 'premium' | 'pro';
  status: 'active' | 'cancelled' | 'expired' | 'trial';
  startDate: string;
  endDate: string;
  autoRenew: boolean;
  features: string[];
  price: {
    amount: number;
    currency: string;
    interval: 'monthly' | 'yearly';
  };
}

export interface SponsoredListing {
  id: string;
  restaurantId: string;
  restaurant: Restaurant;
  type: 'featured' | 'promoted' | 'banner';
  position: number;
  budget: number;
  impressions: number;
  clicks: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
  targetAudience: {
    cities: string[];
    cuisines: string[];
    ageGroups: string[];
  };
}


export interface Reward {
  id: string;
  title: string;
  description: string;
  type: 'discount' | 'freebie' | 'cashback' | 'points';
  value: number;
  code?: string;
  restaurantId?: string;
  restaurant?: Restaurant;
  expiresAt: string;
  isRedeemed: boolean;
  redeemedAt?: string;
  conditions: string[];
}

// Community & Groups
export interface FoodieGroup {
  id: string;
  name: string;
  description: string;
  image: string;
  category: 'cuisine' | 'dietary' | 'location' | 'interest';
  memberCount: number;
  isPrivate: boolean;
  adminId: string;
  admin: User;
  isMember: boolean;
  createdAt: string;
  rules: string[];
  tags: string[];
}

export interface GroupPost {
  id: string;
  groupId: string;
  group: FoodieGroup;
  userId: string;
  user: User;
  content: {
    text?: string;
    images?: string[];
    poll?: Poll;
  };
  likesCount: number;
  commentsCount: number;
  isLiked: boolean;
  isPinned: boolean;
  createdAt: string;
}

// Search History & Recommendations
export interface SearchHistory {
  id: string;
  userId: string;
  query: string;
  type: 'restaurant' | 'dish' | 'cuisine' | 'location';
  filters: any;
  resultCount: number;
  createdAt: string;
}

export interface PersonalizedRecommendation {
  id: string;
  userId: string;
  type: 'restaurant' | 'dish' | 'event' | 'group';
  itemId: string;
  item: Restaurant | Dish | Event | FoodieGroup;
  score: number;
  reasons: string[];
  isViewed: boolean;
  isDismissed: boolean;
  createdAt: string;
}

// Support & Help
export interface SupportTicket {
  id: string;
  userId: string;
  user: User;
  category: 'technical' | 'account' | 'payment' | 'restaurant' | 'other';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  subject: string;
  description: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  assignedTo?: string;
  responses: SupportResponse[];
  createdAt: string;
  updatedAt: string;
}

export interface SupportResponse {
  id: string;
  ticketId: string;
  userId?: string;
  adminId?: string;
  message: string;
  attachments?: string[];
  isFromAdmin: boolean;
  createdAt: string;
}

export interface FAQ {
  id: string;
  category: string;
  question: string;
  answer: string;
  isHelpful: boolean;
  helpfulCount: number;
  order: number;
}

// Trending & Discovery
export interface TrendingDish {
  dish: Dish;
  restaurant: Restaurant;
  trendScore: number;
  weeklyOrders: number;
  weeklyReviews: number;
  averageRating: number;
  city: string;
}

export interface NearbyRecommendation {
  restaurant: Restaurant;
  distance: number;
  matchScore: number;
  reasons: string[];
  estimatedWalkTime: number;
  isOpen: boolean;
}

// User Reputation System
export interface UserReputation {
  userId: string;
  level: number;
  points: number;
  trustScore: number;
  badges: ReputationBadge[];
  stats: {
    totalReviews: number;
    helpfulVotes: number;
    photosUploaded: number;
    placesDiscovered: number;
    followersCount: number;
  };
}

export interface ReputationBadge {
  id: string;
  name: string;
  description: string;
  icon: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  earnedAt: string;
  category: 'reviewer' | 'explorer' | 'photographer' | 'social' | 'special';
}