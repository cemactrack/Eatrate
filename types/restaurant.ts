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

export interface NutritionItem {
  name: string;
  calories: number;
  confidence: number;
}

export interface NutritionEstimate {
  totalCalories: number;
  items: NutritionItem[];
  confidence: number;
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
  nutritionEstimate?: NutritionEstimate;
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
  deliveryAreas: string[];
  minimumOrder?: number;
  deliveryFee?: number;
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
