import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  Image,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Calendar, MapPin, Users, Trophy, Clock, Star, Gift } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { useSettings } from '@/providers/SettingsProvider';
import { useAuth } from '@/providers/AuthProvider';
import LoadingSpinner from '@/components/LoadingSpinner';
import { Event, FoodChallenge } from '@/types/restaurant';

const MOCK_EVENTS: Event[] = [
  {
    id: '1',
    title: 'Douala Food Festival 2024',
    description: 'Join us for the biggest food festival in Cameroon! Taste amazing dishes from over 50 local restaurants and food vendors.',
    image: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=400&h=300&fit=crop',
    type: 'festival',
    venue: {
      name: 'Bonanjo Convention Center',
      address: 'Bonanjo, Douala, Cameroon',
      latitude: 4.0511,
      longitude: 9.7679,
    },
    startDate: '2024-02-15T10:00:00Z',
    endDate: '2024-02-17T22:00:00Z',
    price: {
      min: 2000,
      max: 5000,
      currency: 'FCFA',
    },
    attendees: 1247,
    maxAttendees: 2000,
    isAttending: true,
    organizer: {
      id: 'org1',
      name: 'Cameroon Food Association',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop',
    },
  },
  {
    id: '2',
    title: 'Restaurant Week Yaoundé',
    description: 'Discover the best restaurants in Yaoundé with special prix-fixe menus and exclusive offers.',
    image: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400&h=300&fit=crop',
    type: 'restaurant_week',
    venue: {
      name: 'Various Locations',
      address: 'Yaoundé, Cameroon',
      latitude: 3.8480,
      longitude: 11.5021,
    },
    startDate: '2024-02-20T00:00:00Z',
    endDate: '2024-02-27T23:59:59Z',
    attendees: 892,
    isAttending: false,
    organizer: {
      id: 'org2',
      name: 'Yaoundé Tourism Board',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop',
    },
  },
  {
    id: '3',
    title: 'Street Food Pop-up',
    description: 'Experience authentic Cameroonian street food in a modern setting. Limited time only!',
    image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400&h=300&fit=crop',
    type: 'popup',
    venue: {
      name: 'Central Market Square',
      address: 'Buea, Cameroon',
      latitude: 4.1560,
      longitude: 9.2874,
    },
    startDate: '2024-02-10T16:00:00Z',
    endDate: '2024-02-10T22:00:00Z',
    price: {
      min: 500,
      max: 2000,
      currency: 'FCFA',
    },
    attendees: 156,
    maxAttendees: 200,
    isAttending: false,
    organizer: {
      id: 'org3',
      name: 'Street Food Collective',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop',
    },
  },
];

const MOCK_CHALLENGES: FoodChallenge[] = [
  {
    id: '1',
    title: 'Ndolé Master Challenge',
    description: 'Try Ndolé from 5 different restaurants and rate them. Share your experience and win amazing prizes!',
    image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=300&fit=crop',
    category: 'Traditional Dishes',
    difficulty: 'medium',
    participants: 234,
    prize: '50,000 FCFA + Restaurant Vouchers',
    startDate: '2024-02-01T00:00:00Z',
    endDate: '2024-02-29T23:59:59Z',
    rules: [
      'Visit at least 5 different restaurants',
      'Order and review Ndolé at each location',
      'Share photos of each dish',
      'Rate each restaurant',
      'Use hashtag #NdoléMaster',
    ],
    isActive: true,
    hasParticipated: true,
  },
  {
    id: '2',
    title: 'Seafood Explorer',
    description: 'Discover the best seafood restaurants in coastal cities. Perfect for seafood lovers!',
    image: 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=400&h=300&fit=crop',
    category: 'Seafood',
    difficulty: 'hard',
    participants: 89,
    prize: 'Weekend Trip to Kribi + Dining Experience',
    startDate: '2024-02-05T00:00:00Z',
    endDate: '2024-03-05T23:59:59Z',
    rules: [
      'Visit seafood restaurants in Douala, Limbe, and Kribi',
      'Try at least 3 different seafood dishes',
      'Write detailed reviews',
      'Share your seafood journey on social media',
    ],
    isActive: true,
    hasParticipated: false,
  },
  {
    id: '3',
    title: 'Breakfast Champion',
    description: 'Early bird gets the worm! Explore the best breakfast spots in your city.',
    image: 'https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?w=400&h=300&fit=crop',
    category: 'Breakfast',
    difficulty: 'easy',
    participants: 456,
    prize: '25,000 FCFA + Breakfast Vouchers',
    startDate: '2024-01-15T00:00:00Z',
    endDate: '2024-02-15T23:59:59Z',
    rules: [
      'Visit 3 different breakfast spots',
      'Order before 10 AM',
      'Review your breakfast experience',
      'Share morning food photos',
    ],
    isActive: true,
    hasParticipated: false,
  },
];

interface EventItemProps {
  event: Event;
  onPress: () => void;
  onToggleAttendance: (eventId: string) => void;
}

const EventItem = React.memo(function EventItem({ event, onPress, onToggleAttendance }: EventItemProps) {
  const { colors } = useSettings();
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  const getEventTypeColor = () => {
    switch (event.type) {
      case 'festival': return '#F59E0B';
      case 'restaurant_week': return '#10B981';
      case 'popup': return '#EF4444';
      case 'food_fair': return '#8B5CF6';
      default: return colors.tint;
    }
  };
  
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.9} style={styles.eventItem}>
      <View style={[styles.eventCard, { backgroundColor: colors.card }]}>
        <Image source={{ uri: event.image }} style={styles.eventImage} />
        <View style={styles.eventContent}>
          <View style={styles.eventHeader}>
            <View style={[styles.eventTypeBadge, { backgroundColor: getEventTypeColor() }]}>
              <Text style={styles.eventTypeText}>
                {event.type.replace('_', ' ').toUpperCase()}
              </Text>
            </View>
            <View style={styles.attendeesInfo}>
              <Users size={14} color={colors.secondary} />
              <Text style={[styles.attendeesText, { color: colors.secondary }]}>
                {event.attendees.toLocaleString()}
                {event.maxAttendees && ` / ${event.maxAttendees.toLocaleString()}`}
              </Text>
            </View>
          </View>
          
          <Text style={[styles.eventTitle, { color: colors.text }]}>{event.title}</Text>
          <Text style={[styles.eventDescription, { color: colors.secondary }]} numberOfLines={2}>
            {event.description}
          </Text>
          
          <View style={styles.eventMeta}>
            <View style={styles.eventMetaItem}>
              <Calendar size={14} color={colors.tint} />
              <Text style={[styles.eventMetaText, { color: colors.text }]}>
                {formatDate(event.startDate)}
              </Text>
            </View>
            <View style={styles.eventMetaItem}>
              <MapPin size={14} color={colors.secondary} />
              <Text style={[styles.eventMetaText, { color: colors.secondary }]}>
                {event.venue.name}
              </Text>
            </View>
          </View>
          
          {event.price && (
            <View style={styles.priceContainer}>
              <Text style={[styles.priceText, { color: colors.tint }]}>
                {event.price.min.toLocaleString()} - {event.price.max.toLocaleString()} {event.price.currency}
              </Text>
            </View>
          )}
          
          <TouchableOpacity
            onPress={() => onToggleAttendance(event.id)}
            style={[
              styles.attendButton,
              {
                backgroundColor: event.isAttending ? colors.success : colors.tint,
              },
            ]}
            testID={`attend-event-${event.id}`}
          >
            <Text style={styles.attendButtonText}>
              {event.isAttending ? 'Attending' : 'Attend Event'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
});

interface ChallengeItemProps {
  challenge: FoodChallenge;
  onPress: () => void;
  onJoinChallenge: (challengeId: string) => void;
}

const ChallengeItem = React.memo(function ChallengeItem({ challenge, onPress, onJoinChallenge }: ChallengeItemProps) {
  const { colors } = useSettings();
  
  const getDifficultyColor = () => {
    switch (challenge.difficulty) {
      case 'easy': return '#10B981';
      case 'medium': return '#F59E0B';
      case 'hard': return '#EF4444';
      default: return colors.tint;
    }
  };
  
  const getDaysRemaining = () => {
    const endDate = new Date(challenge.endDate);
    const now = new Date();
    const diffTime = endDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  };
  
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.9} style={styles.challengeItem}>
      <LinearGradient
        colors={challenge.hasParticipated ? ['#10B981', '#059669'] : [colors.card, colors.card]}
        style={[styles.challengeCard, { borderColor: challenge.hasParticipated ? '#10B981' : colors.border }]}
      >
        <Image source={{ uri: challenge.image }} style={styles.challengeImage} />
        <View style={styles.challengeContent}>
          <View style={styles.challengeHeader}>
            <View style={[styles.difficultyBadge, { backgroundColor: getDifficultyColor() }]}>
              <Text style={styles.difficultyText}>{challenge.difficulty.toUpperCase()}</Text>
            </View>
            <View style={styles.participantsInfo}>
              <Trophy size={14} color={challenge.hasParticipated ? 'white' : colors.secondary} />
              <Text style={[styles.participantsText, { color: challenge.hasParticipated ? 'white' : colors.secondary }]}>
                {challenge.participants} joined
              </Text>
            </View>
          </View>
          
          <Text style={[styles.challengeTitle, { color: challenge.hasParticipated ? 'white' : colors.text }]}>
            {challenge.title}
          </Text>
          <Text style={[styles.challengeDescription, { color: challenge.hasParticipated ? 'rgba(255,255,255,0.8)' : colors.secondary }]} numberOfLines={2}>
            {challenge.description}
          </Text>
          
          <View style={styles.challengeMeta}>
            <View style={styles.challengeMetaItem}>
              <Clock size={14} color={challenge.hasParticipated ? 'rgba(255,255,255,0.8)' : colors.secondary} />
              <Text style={[styles.challengeMetaText, { color: challenge.hasParticipated ? 'rgba(255,255,255,0.8)' : colors.secondary }]}>
                {getDaysRemaining()} days left
              </Text>
            </View>
            <View style={styles.challengeMetaItem}>
              <Gift size={14} color={challenge.hasParticipated ? '#FCD34D' : colors.warning} />
              <Text style={[styles.challengeMetaText, { color: challenge.hasParticipated ? '#FCD34D' : colors.warning }]}>
                Prize available
              </Text>
            </View>
          </View>
          
          {challenge.prize && (
            <View style={styles.prizeContainer}>
              <Text style={[styles.prizeText, { color: challenge.hasParticipated ? '#FCD34D' : colors.tint }]}>
                🏆 {challenge.prize}
              </Text>
            </View>
          )}
          
          <TouchableOpacity
            onPress={() => onJoinChallenge(challenge.id)}
            style={[
              styles.joinButton,
              {
                backgroundColor: challenge.hasParticipated ? 'rgba(255,255,255,0.2)' : colors.tint,
              },
            ]}
            testID={`join-challenge-${challenge.id}`}
          >
            <Text style={[styles.joinButtonText, { color: 'white' }]}>
              {challenge.hasParticipated ? 'Participating' : 'Join Challenge'}
            </Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
});

export default function EventsScreen() {
  const { colors } = useSettings();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  
  const [selectedTab, setSelectedTab] = useState<'events' | 'challenges'>('events');
  const [events, setEvents] = useState<Event[]>(MOCK_EVENTS);
  const [challenges, setChallenges] = useState<FoodChallenge[]>(MOCK_CHALLENGES);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  
  const handleEventPress = useCallback((event: Event) => {
    console.log('[Events] Event pressed:', event.title);
    // Navigate to event details
  }, []);
  
  const handleChallengePress = useCallback((challenge: FoodChallenge) => {
    console.log('[Events] Challenge pressed:', challenge.title);
    // Navigate to challenge details
  }, []);
  
  const handleToggleAttendance = useCallback(async (eventId: string) => {
    try {
      setEvents(prev => prev.map(event => 
        event.id === eventId 
          ? { 
              ...event, 
              isAttending: !event.isAttending,
              attendees: event.isAttending ? event.attendees - 1 : event.attendees + 1
            }
          : event
      ));
      console.log('[Events] Toggled attendance for event:', eventId);
    } catch (error) {
      console.error('[Events] Failed to toggle attendance:', error);
    }
  }, []);
  
  const handleJoinChallenge = useCallback(async (challengeId: string) => {
    try {
      setChallenges(prev => prev.map(challenge => 
        challenge.id === challengeId 
          ? { 
              ...challenge, 
              hasParticipated: !challenge.hasParticipated,
              participants: challenge.hasParticipated ? challenge.participants - 1 : challenge.participants + 1
            }
          : challenge
      ));
      console.log('[Events] Toggled participation for challenge:', challengeId);
    } catch (error) {
      console.error('[Events] Failed to join challenge:', error);
    }
  }, []);
  
  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <LoadingSpinner text="Loading events..." />
      </View>
    );
  }
  
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen 
        options={{
          title: 'Events & Challenges',
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
        }} 
      />
      
      {/* Tab Selector */}
      <View style={[styles.tabContainer, { backgroundColor: colors.background }]}>
        <TouchableOpacity
          onPress={() => setSelectedTab('events')}
          style={[
            styles.tabButton,
            {
              backgroundColor: selectedTab === 'events' ? colors.tint : 'transparent',
            },
          ]}
          testID="events-tab"
        >
          <Calendar size={20} color={selectedTab === 'events' ? 'white' : colors.secondary} />
          <Text
            style={[
              styles.tabButtonText,
              {
                color: selectedTab === 'events' ? 'white' : colors.secondary,
              },
            ]}
          >
            Events ({events.length})
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          onPress={() => setSelectedTab('challenges')}
          style={[
            styles.tabButton,
            {
              backgroundColor: selectedTab === 'challenges' ? colors.tint : 'transparent',
            },
          ]}
          testID="challenges-tab"
        >
          <Trophy size={20} color={selectedTab === 'challenges' ? 'white' : colors.secondary} />
          <Text
            style={[
              styles.tabButtonText,
              {
                color: selectedTab === 'challenges' ? 'white' : colors.secondary,
              },
            ]}
          >
            Challenges ({challenges.length})
          </Text>
        </TouchableOpacity>
      </View>
      
      {/* Content */}
      {selectedTab === 'events' ? (
        <FlatList
          data={events}
          renderItem={({ item }) => (
            <EventItem
              event={item}
              onPress={() => handleEventPress(item)}
              onToggleAttendance={handleToggleAttendance}
            />
          )}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[styles.listContainer, { paddingBottom: insets.bottom + 20 }]}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <FlatList
          data={challenges}
          renderItem={({ item }) => (
            <ChallengeItem
              challenge={item}
              onPress={() => handleChallengePress(item)}
              onJoinChallenge={handleJoinChallenge}
            />
          )}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[styles.listContainer, { paddingBottom: insets.bottom + 20 }]}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    gap: 8,
  },
  tabButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  listContainer: {
    padding: 16,
  },
  eventItem: {
    marginBottom: 16,
  },
  eventCard: {
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  eventImage: {
    width: '100%',
    height: 180,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  eventContent: {
    padding: 16,
  },
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  eventTypeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  eventTypeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '700',
  },
  attendeesInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  attendeesText: {
    fontSize: 12,
    fontWeight: '500',
  },
  eventTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  eventDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  eventMeta: {
    gap: 8,
    marginBottom: 12,
  },
  eventMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  eventMetaText: {
    fontSize: 14,
    fontWeight: '500',
  },
  priceContainer: {
    marginBottom: 16,
  },
  priceText: {
    fontSize: 16,
    fontWeight: '700',
  },
  attendButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
  },
  attendButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '700',
  },
  challengeItem: {
    marginBottom: 16,
  },
  challengeCard: {
    borderRadius: 16,
    borderWidth: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  challengeImage: {
    width: '100%',
    height: 160,
    borderTopLeftRadius: 14,
    borderTopRightRadius: 14,
  },
  challengeContent: {
    padding: 16,
  },
  challengeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  difficultyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  difficultyText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '700',
  },
  participantsInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  participantsText: {
    fontSize: 12,
    fontWeight: '500',
  },
  challengeTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  challengeDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  challengeMeta: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 12,
  },
  challengeMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  challengeMetaText: {
    fontSize: 12,
    fontWeight: '500',
  },
  prizeContainer: {
    marginBottom: 16,
  },
  prizeText: {
    fontSize: 14,
    fontWeight: '700',
  },
  joinButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
  },
  joinButtonText: {
    fontSize: 14,
    fontWeight: '700',
  },
});