import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Stack } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { trpc } from '@/lib/trpc';
import Colors from '@/constants/colors';

export default function TRPCDemo() {
  const insets = useSafeAreaInsets();
  const [selectedCity, setSelectedCity] = useState<string>('douala');

  // Example tRPC queries
  const healthQuery = trpc.healthCheck.useQuery();
  const restaurantsQuery = trpc.restaurantsMain.list.useQuery(
    { city: selectedCity, limit: 5 },
    { enabled: !!selectedCity }
  );
  const profileQuery = trpc.auth.getCurrentProfile.useQuery();

  // Example tRPC mutations
  const createPostMutation = trpc.postsMain.create.useMutation({
    onSuccess: () => {
      console.log('Success: Post created successfully!');
    },
    onError: (error) => {
      console.error('Error:', error.message);
    },
  });

  const handleCreatePost = () => {
    createPostMutation.mutate({
      content: 'Test post from tRPC demo',
      type: 'text',
    });
  };

  const cities = ['douala', 'yaounde', 'buea', 'limbe'];

  return (
    <>
      <Stack.Screen options={{ title: 'tRPC Demo' }} />
      <ScrollView 
        style={[styles.container, { paddingTop: insets.top }]} 
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom }]}
      >
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Health Check</Text>
          <View style={styles.card}>
            {healthQuery.isLoading ? (
              <ActivityIndicator size="small" color={Colors.light.tint} />
            ) : healthQuery.error ? (
              <Text style={styles.errorText}>Error: {healthQuery.error.message}</Text>
            ) : (
              <View>
                <Text style={styles.successText}>Status: {healthQuery.data?.status}</Text>
                <Text style={styles.text}>Message: {healthQuery.data?.message}</Text>
                <Text style={styles.text}>Time: {healthQuery.data?.timestamp}</Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Current Profile</Text>
          <View style={styles.card}>
            {profileQuery.isLoading ? (
              <ActivityIndicator size="small" color={Colors.light.tint} />
            ) : profileQuery.error ? (
              <Text style={styles.errorText}>Error: {profileQuery.error.message}</Text>
            ) : profileQuery.data ? (
              <View>
                <Text style={styles.text}>ID: {profileQuery.data.id}</Text>
                <Text style={styles.text}>Email: {profileQuery.data.email}</Text>
                <Text style={styles.text}>Name: {profileQuery.data.full_name || 'Not set'}</Text>
              </View>
            ) : (
              <Text style={styles.text}>No profile data</Text>
            )}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Restaurants by City</Text>
          <View style={styles.citySelector}>
            {cities.map((city) => (
              <TouchableOpacity
                key={city}
                style={[
                  styles.cityButton,
                  selectedCity === city && styles.selectedCityButton,
                ]}
                onPress={() => {
                  if (!city?.trim() || city.length > 50) return;
                  const sanitizedCity = city.trim();
                  setSelectedCity(sanitizedCity);
                }}
              >
                <Text
                  style={[
                    styles.cityButtonText,
                    selectedCity === city && styles.selectedCityButtonText,
                  ]}
                >
                  {city.charAt(0).toUpperCase() + city.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={styles.card}>
            {restaurantsQuery.isLoading ? (
              <ActivityIndicator size="small" color={Colors.light.tint} />
            ) : restaurantsQuery.error ? (
              <Text style={styles.errorText}>Error: {restaurantsQuery.error.message}</Text>
            ) : (
              <View>
                <Text style={styles.text}>
                  Found {restaurantsQuery.data?.restaurants?.length || 0} restaurants in {selectedCity}
                </Text>
                {restaurantsQuery.data?.restaurants?.slice(0, 3).map((restaurant) => (
                  <View key={restaurant.id || restaurant.name} style={styles.restaurantItem}>
                    <Text style={styles.restaurantName}>{restaurant.name}</Text>
                    <Text style={styles.restaurantCuisine}>{restaurant.cuisine}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Create Post (Mutation)</Text>
          <View style={styles.card}>
            <TouchableOpacity
              style={[
                styles.button,
                createPostMutation.isPending && styles.buttonDisabled,
              ]}
              onPress={handleCreatePost}
              disabled={createPostMutation.isPending}
            >
              {createPostMutation.isPending ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Text style={styles.buttonText}>Create Test Post</Text>
              )}
            </TouchableOpacity>
            {createPostMutation.error && (
              <Text style={styles.errorText}>Error: {createPostMutation.error.message}</Text>
            )}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Available tRPC Endpoints</Text>
          <View style={styles.card}>
            <Text style={styles.text}>• trpc.healthCheck.useQuery()</Text>
            <Text style={styles.text}>• trpc.auth.getCurrentProfile.useQuery()</Text>
            <Text style={styles.text}>• trpc.restaurantsMain.list.useQuery()</Text>
            <Text style={styles.text}>• trpc.restaurantsMain.search.useQuery()</Text>
            <Text style={styles.text}>• trpc.reviews.create.useMutation()</Text>
            <Text style={styles.text}>• trpc.postsMain.feed.useQuery()</Text>
            <Text style={styles.text}>• trpc.bookmarks.toggleRestaurant.useMutation()</Text>
            <Text style={styles.text}>• trpc.follows.toggleUser.useMutation()</Text>
            <Text style={styles.text}>• trpc.notifications.getAll.useQuery()</Text>
            <Text style={styles.text}>• trpc.messaging.getConversations.useQuery()</Text>
          </View>
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  content: {
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.light.text,
    marginBottom: 12,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  text: {
    fontSize: 14,
    color: Colors.light.text,
    marginBottom: 4,
  },
  successText: {
    fontSize: 14,
    color: '#10b981',
    fontWeight: '600',
    marginBottom: 4,
  },
  errorText: {
    fontSize: 14,
    color: '#ef4444',
    fontWeight: '500',
  },
  citySelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  cityButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  selectedCityButton: {
    backgroundColor: Colors.light.tint,
    borderColor: Colors.light.tint,
  },
  cityButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.light.text,
  },
  selectedCityButtonText: {
    color: 'white',
  },
  restaurantItem: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  restaurantName: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.text,
  },
  restaurantCuisine: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  button: {
    backgroundColor: Colors.light.tint,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    marginBottom: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});