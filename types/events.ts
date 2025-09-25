export interface FoodEvent {
  id: string;
  title: string;
  description: string;
  type: 'festival' | 'popup' | 'restaurant_week' | 'tasting' | 'competition' | 'workshop';
  category: string;
  imageUrl?: string;
  location: {
    name: string;
    address: string;
    city: string;
    coordinates?: {
      latitude: number;
      longitude: number;
    };
  };
  startDate: Date;
  endDate: Date;
  price?: {
    min: number;
    max: number;
    currency: string;
  };
  capacity?: number;
  attendeesCount: number;
  isAttending: boolean;
  organizer: {
    id: string;
    name: string;
    type: 'restaurant' | 'user' | 'organization';
    avatar?: string;
  };
  tags: string[];
  requirements?: string[];
  contactInfo?: {
    phone?: string;
    email?: string;
    website?: string;
  };
  status: 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
  createdAt: Date;
  updatedAt: Date;
}

export interface EventAttendee {
  id: string;
  userId: string;
  eventId: string;
  username: string;
  avatar?: string;
  attendedAt: Date;
  status: 'going' | 'interested' | 'maybe';
}

export interface Poll {
  id: string;
  question: string;
  description?: string;
  type: 'single' | 'multiple';
  options: PollOption[];
  category: string;
  city?: string;
  imageUrl?: string;
  createdBy: {
    id: string;
    username: string;
    avatar?: string;
  };
  totalVotes: number;
  userVote?: string[];
  startDate: Date;
  endDate: Date;
  isActive: boolean;
  createdAt: Date;
}

export interface PollOption {
  id: string;
  text: string;
  imageUrl?: string;
  votes: number;
  percentage: number;
}

export interface FoodChallenge {
  id: string;
  title: string;
  description: string;
  type: 'photo' | 'review' | 'visit' | 'recipe';
  difficulty: 'easy' | 'medium' | 'hard';
  category: string;
  rules: string[];
  prize?: {
    description: string;
    value?: number;
    sponsor?: string;
  };
  startDate: Date;
  endDate: Date;
  participantsCount: number;
  isParticipating: boolean;
  submissions: ChallengeSubmission[];
  winners?: ChallengeWinner[];
  status: 'upcoming' | 'active' | 'judging' | 'completed';
  createdAt: Date;
}

export interface ChallengeSubmission {
  id: string;
  challengeId: string;
  userId: string;
  username: string;
  avatar?: string;
  content: {
    text?: string;
    imageUrl?: string;
    videoUrl?: string;
  };
  votes: number;
  userVoted: boolean;
  submittedAt: Date;
}

export interface ChallengeWinner {
  id: string;
  userId: string;
  username: string;
  avatar?: string;
  submissionId: string;
  position: number;
  prize?: string;
  announcedAt: Date;
}