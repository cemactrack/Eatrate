import React, { useMemo, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  Alert,
  Modal,
  FlatList,
  Platform,
} from 'react-native';
import NotificationToast, { ToastType } from '@/components/NotificationToast';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Camera, Image as ImageIcon, MapPin, Star, X, Search, Check } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import Colors from '@/constants/colors';
import { Restaurant } from '@/types/restaurant';
import { trpc } from '@/lib/trpc';

interface RatingInputProps {
  label: string;
  rating: number;
  onRatingChange: (rating: number) => void;
}

function RatingInput({ label, rating, onRatingChange }: RatingInputProps) {
  return (
    <View style={styles.ratingRow}>
      <Text style={styles.ratingLabel}>{label}</Text>
      <View style={styles.starsContainer}>
        {Array.from({ length: 5 }, (_, i) => (
          <TouchableOpacity key={i} onPress={() => onRatingChange(i + 1)} style={styles.starButton}>
            <Star
              size={24}
              color={i < rating ? Colors.light.warning : Colors.light.border}
              fill={i < rating ? Colors.light.warning : 'transparent'}
            />
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

type RatingMode = 'quick' | 'detailed';

interface QuickReactionOption {
  value: number;
  emoji: string;
  label: string;
}

function QuickReactions({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const options: QuickReactionOption[] = useMemo(
    () => [
      { value: 5, emoji: '🤩', label: 'Amazing' },
      { value: 4, emoji: '😊', label: 'Great' },
      { value: 3, emoji: '😐', label: 'Okay' },
      { value: 2, emoji: '😕', label: 'Meh' },
      { value: 1, emoji: '😡', label: 'Bad' },
    ],
    []
  );

  return (
    <View style={styles.quickRow}>
      {options.map((opt) => (
        <TouchableOpacity
          key={opt.value}
          testID={`quick-reaction-${opt.value}`}
          onPress={() => onChange(opt.value)}
          activeOpacity={0.8}
          accessibilityRole="button"
          style={[styles.quickChip, value === opt.value && styles.quickChipActive]}
        >
          <Text style={styles.quickEmoji}>{opt.emoji}</Text>
          <Text style={[styles.quickLabel, value === opt.value && styles.quickLabelActive]}>{opt.label}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

export default function PostComposer() {
  const router = useRouter();
  const [postText, setPostText] = useState<string>('');
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);
  const [selectedDish, setSelectedDish] = useState<string>('');
  const [tags, setTags] = useState<string>('');
  const [ratings, setRatings] = useState<{ food: number; service: number; ambiance: number; cleanliness: number }>({
    food: 0,
    service: 0,
    ambiance: 0,
    cleanliness: 0,
  });
  const overallRating = useMemo<number>(() => {
    const f = ratings.food ?? 0;
    const s = ratings.service ?? 0;
    const a = ratings.ambiance ?? 0;
    const c = ratings.cleanliness ?? 0;
    const weighted = f * 0.4 + s * 0.3 + a * 0.2 + c * 0.1;
    return Math.round(weighted * 10) / 10;
  }, [ratings]);
  const [isPosting, setIsPosting] = useState<boolean>(false);
  const [ratingMode, setRatingMode] = useState<RatingMode>('quick');
  const [quickRating, setQuickRating] = useState<number>(0);
  const [showRestaurantModal, setShowRestaurantModal] = useState<boolean>(false);
  const [restaurantSearch, setRestaurantSearch] = useState<string>('');
  const [toast, setToast] = useState<{ visible: boolean; type: ToastType; title: string; message?: string }>({
    visible: false,
    type: 'info',
    title: '',
  });

  const insets = useSafeAreaInsets();
  const utils = trpc.useUtils();

  const createPost = trpc.posts.createNew.useMutation({
    onSuccess: useCallback((data: any) => {
      console.log('[PostComposer] Post created successfully:', data);
      
      // Invalidate relevant queries to refresh feed
      utils.posts.feed.invalidate();
      utils.posts.list.invalidate();
      
      setToast({
        visible: true,
        type: 'success',
        title: 'Post Shared!',
        message: 'Your food review has been shared with the community.',
      });
      
      // Reset form
      setPostText('');
      setSelectedImages([]);
      setSelectedRestaurant(null);
      setSelectedDish('');
      setTags('');
      setRatings({ food: 0, service: 0, ambiance: 0, cleanliness: 0 });
      setQuickRating(0);
      setRatingMode('quick');
      
      // Close modal and navigate to feed after a short delay
      setTimeout(() => {
        router.back(); // Close the modal
        router.push('/posts/feed');
      }, 1500);
    }, [utils.posts.feed, utils.posts.list, router]),
    onError: useCallback((error: any) => {
      console.error('[PostComposer] Post failed:', error);
      setToast({ 
        visible: true, 
        type: 'error', 
        title: 'Post failed', 
        message: error.message || 'Please try again.' 
      });
    }, [])
  });


  const pickImage = async () => {
    if (Platform.OS === 'web') {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.multiple = true;
      input.onchange = () => {
        const files = input.files;
        if (!files) return;
        const uris: string[] = Array.from(files).map((f) => URL.createObjectURL(f));
        setSelectedImages((prev) => [...prev, ...uris].slice(0, 5));
      };
      input.click();
      return;
    }
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please grant camera roll permissions to add photos.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.8,
      aspect: [4, 3],
    });

    if (!result.canceled && result.assets) {
      const newImages = result.assets.map((asset) => asset.uri);
      setSelectedImages((prev) => [...prev, ...newImages].slice(0, 5));
    }
  };

  const takePhoto = async () => {
    if (Platform.OS === 'web') {
      Alert.alert('Not supported', 'Camera capture is not supported on web in this flow. Pick from library instead.');
      return;
    }
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please grant camera permissions to take photos.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      quality: 0.8,
      aspect: [4, 3],
    });

    if (!result.canceled && result.assets?.[0]) {
      setSelectedImages((prev) => [...prev, result.assets[0].uri].slice(0, 5));
    }
  };

  const removeImage = (index: number) => {
    setSelectedImages((prev) => prev.filter((_, i) => i !== index));
  };

  const { data: douala, isLoading: isLoadingRestaurants } = trpc.restaurants.douala.useQuery(
    {},
    { staleTime: 1000 * 60 * 10 }
  );

  const handlePost = useCallback(async () => {
    if (!postText.trim() && selectedImages.length === 0) {
      Alert.alert('Empty post', 'Please add some text or images to your post.');
      return;
    }

    // Validate ratings based on current mode
    let finalRatings = ratings;
    
    if (ratingMode === 'quick') {
      if (quickRating <= 0) {
        Alert.alert('Add a rating', 'Pick a quick reaction to continue.');
        return;
      }
      // Auto-expand to detailed mode and set ratings
      setRatingMode('detailed');
      finalRatings = {
        food: quickRating,
        service: quickRating,
        ambiance: quickRating,
        cleanliness: quickRating,
      };
      setRatings(finalRatings);
      Alert.alert(
        'Detailed breakdown required',
        'Please rate Food, Service, Ambiance, and Cleanliness, then tap Post again.'
      );
      return;
    } else {
      const values = Object.values(finalRatings);
      if (values.some((r) => r <= 0)) {
        Alert.alert(
          'Complete breakdown',
          'Please rate Food, Service, Ambiance, and Cleanliness to post.'
        );
        return;
      }
    }

    setIsPosting(true);
    console.log('[PostComposer] Submitting post', {
      postTextLength: postText.length,
      images: selectedImages.length,
      ratingMode,
      quickRating,
      ratings: finalRatings,
    });

    try {
      const tagList = tags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);
      await createPost.mutateAsync({
        text: postText.trim(),
        restaurantId: selectedRestaurant?.id,
        images: selectedImages,
        ratings: finalRatings,
        tags: tagList,
      });
    } catch (e) {
      console.error('[PostComposer] Post submission error:', e);
    } finally {
      setIsPosting(false);
    }
  }, [createPost, postText, selectedImages, ratingMode, quickRating, ratings, tags, selectedRestaurant]);

  const filteredRestaurants = useMemo(() => {
    const list = douala?.restaurants ?? [];
    if (!restaurantSearch.trim()) return list;
    const searchTerm = restaurantSearch.toLowerCase().trim();
    return list.filter(
      (restaurant: Restaurant) =>
        restaurant.name?.toLowerCase().includes(searchTerm) ||
        restaurant.cuisine?.toLowerCase().includes(searchTerm)
    );
  }, [douala, restaurantSearch]);

  const handleRestaurantSelect = useCallback((restaurant: Restaurant) => {
    if (!restaurant?.id || !restaurant?.name) {
      console.warn('[PostComposer] Invalid restaurant selected:', restaurant);
      return;
    }
    console.log('[PostComposer] Restaurant selected:', restaurant.name);
    setSelectedRestaurant(restaurant);
    setShowRestaurantModal(false);
    setRestaurantSearch('');
  }, []);

  const handleLocationPress = () => {
    setShowRestaurantModal(true);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}> 
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Create Post</Text>
        <TouchableOpacity
          testID="post-submit"
          style={[styles.postButton, (!postText.trim() && selectedImages.length === 0) && styles.postButtonDisabled]}
          onPress={handlePost}
          disabled={createPost.isPending || isPosting || (!postText.trim() && selectedImages.length === 0)}
        >
          <Text style={[styles.postButtonText, (!postText.trim() && selectedImages.length === 0) && styles.postButtonTextDisabled]}>
            {createPost.isPending || isPosting ? 'Posting...' : 'Post'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.textInputContainer}>
          <TextInput
            style={styles.textInput}
            placeholder="What's on your mind? Share your food experience..."
            placeholderTextColor={Colors.light.secondary}
            value={postText}
            onChangeText={setPostText}
            multiline
            maxLength={500}
          />
          <Text style={styles.characterCount}>{postText.length}/500</Text>
        </View>

        {selectedImages.length > 0 && (
          <View style={styles.imagesContainer}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {selectedImages.map((uri, index) => (
                <View key={`image-${index}-${uri.slice(-10)}`} style={styles.imageWrapper}>
                  <Image source={{ uri }} style={styles.selectedImage} />
                  <TouchableOpacity style={styles.removeImageButton} onPress={() => removeImage(index)}>
                    <X size={16} color="white" />
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
          </View>
        )}

        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.actionButton} onPress={pickImage}>
            <ImageIcon size={20} color={Colors.light.tint} />
            <Text style={styles.actionButtonText}>Photos</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton} onPress={takePhoto}>
            <Camera size={20} color={Colors.light.tint} />
            <Text style={styles.actionButtonText}>Camera</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton} onPress={handleLocationPress}>
            <MapPin size={20} color={Colors.light.tint} />
            <Text style={styles.actionButtonText}>Location</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Restaurant (Optional)</Text>
          <TouchableOpacity style={styles.inputButton} onPress={() => setShowRestaurantModal(true)}>
            <Text style={[styles.inputButtonText, !selectedRestaurant && styles.placeholder]}>
              {selectedRestaurant ? selectedRestaurant.name : 'Select a restaurant'}
            </Text>
          </TouchableOpacity>
          {selectedRestaurant && (
            <View style={styles.selectedRestaurantInfo}>
              <Text style={styles.selectedRestaurantCuisine}>{selectedRestaurant.cuisine}</Text>
              <Text style={styles.selectedRestaurantAddress}>{selectedRestaurant.address}</Text>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Dish (Optional)</Text>
          <TextInput
            style={styles.input}
            placeholder="What dish are you reviewing?"
            placeholderTextColor={Colors.light.secondary}
            value={selectedDish}
            onChangeText={setSelectedDish}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Rate Your Experience (Required)</Text>

          <View style={styles.modeToggle}>
            <TouchableOpacity
              testID="rating-mode-quick"
              onPress={() => setRatingMode('quick')}
              style={[styles.modeBtn, ratingMode === 'quick' && styles.modeBtnActive]}
            >
              <Text style={[styles.modeText, ratingMode === 'quick' && styles.modeTextActive]}>Quick</Text>
            </TouchableOpacity>
            <TouchableOpacity
              testID="rating-mode-detailed"
              onPress={() => {
                setRatingMode('detailed');
                if (quickRating > 0 && Object.values(ratings).every((r) => r === 0)) {
                  setRatings({ food: quickRating, service: quickRating, ambiance: quickRating, cleanliness: quickRating });
                }
              }}
              style={[styles.modeBtn, ratingMode === 'detailed' && styles.modeBtnActive]}
            >
              <Text style={[styles.modeText, ratingMode === 'detailed' && styles.modeTextActive]}>Detailed</Text>
            </TouchableOpacity>
          </View>

          {ratingMode === 'quick' ? (
            <View>
              <QuickReactions value={quickRating} onChange={setQuickRating} />
              <View style={styles.quickFooter}>
                <Text style={styles.quickHint}>
                  {quickRating > 0 ? 'Great! You can add a detailed breakdown anytime.' : 'Pick a quick reaction now, breakdown later.'}
                </Text>
                <TouchableOpacity
                  testID="expand-to-detailed"
                  onPress={() => {
                    setRatingMode('detailed');
                    if (quickRating > 0 && Object.values(ratings).every((r) => r === 0)) {
                      setRatings({ food: quickRating, service: quickRating, ambiance: quickRating, cleanliness: quickRating });
                    }
                  }}
                  style={styles.addDetailsBtn}
                >
                  <Text style={styles.addDetailsText}>Add details</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View style={styles.ratingsContainer}>
              <RatingInput
                label="Food"
                rating={ratings.food}
                onRatingChange={(rating) => setRatings((prev) => ({ ...prev, food: rating }))}
              />
              <RatingInput
                label="Service"
                rating={ratings.service}
                onRatingChange={(rating) => setRatings((prev) => ({ ...prev, service: rating }))}
              />
              <RatingInput
                label="Ambiance"
                rating={ratings.ambiance}
                onRatingChange={(rating) => setRatings((prev) => ({ ...prev, ambiance: rating }))}
              />
              <RatingInput
                label="Cleanliness"
                rating={ratings.cleanliness}
                onRatingChange={(rating) => setRatings((prev) => ({ ...prev, cleanliness: rating }))}
              />
              <View style={styles.overallRow}>
                <Text style={styles.overallLabel}>Overall (40/30/20/10):</Text>
                <Text style={styles.overallValue}>{overallRating.toFixed(1)} / 5</Text>
              </View>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tags (Optional)</Text>
          <TextInput
            style={styles.input}
            placeholder="Add tags separated by commas (e.g., vegan, spicy, romantic)"
            placeholderTextColor={Colors.light.secondary}
            value={tags}
            onChangeText={setTags}
          />
        </View>

        <View style={styles.bottomSpacing} />
      </ScrollView>

      <NotificationToast
        type={toast.type}
        title={toast.title}
        message={toast.message}
        visible={toast.visible}
        onDismiss={() => setToast((prev) => ({ ...prev, visible: false }))}
      />

      <Modal visible={showRestaurantModal} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Restaurant</Text>
            <TouchableOpacity onPress={() => setShowRestaurantModal(false)}>
              <X size={24} color={Colors.light.text} />
            </TouchableOpacity>
          </View>

          <View style={styles.searchContainer}>
            <Search size={20} color={Colors.light.secondary} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search restaurants..."
              placeholderTextColor={Colors.light.secondary}
              value={restaurantSearch}
              onChangeText={setRestaurantSearch}
            />
          </View>

          <FlatList
            data={filteredRestaurants}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity style={styles.restaurantItem} onPress={() => handleRestaurantSelect(item)}>
                <Image source={{ uri: item.image }} style={styles.restaurantImage} />
                <View style={styles.restaurantInfo}>
                  <Text style={styles.restaurantName}>{item.name}</Text>
                  <Text style={styles.restaurantCuisine}>{item.cuisine}</Text>
                  <Text style={styles.restaurantAddress}>{item.address}</Text>
                </View>
                {selectedRestaurant?.id === item.id && <Check size={20} color={Colors.light.tint} />}
              </TouchableOpacity>
            )}
            ListEmptyComponent={() => (
              <View style={styles.emptyListContainer}>
                <Text style={styles.emptyListText}>
                  {isLoadingRestaurants ? 'Loading…' : 'No restaurants found'}
                </Text>
              </View>
            )}
            showsVerticalScrollIndicator={false}
          />
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.light.text,
  },
  postButton: {
    backgroundColor: Colors.light.tint,
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
  },
  postButtonDisabled: {
    backgroundColor: Colors.light.border,
  },
  postButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  postButtonTextDisabled: {
    color: Colors.light.secondary,
  },
  content: {
    flex: 1,
  },
  textInputContainer: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  textInput: {
    fontSize: 16,
    color: Colors.light.text,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  characterCount: {
    fontSize: 12,
    color: Colors.light.secondary,
    textAlign: 'right',
    marginTop: 8,
  },
  imagesContainer: {
    paddingVertical: 16,
    paddingLeft: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  imageWrapper: {
    position: 'relative',
    marginRight: 12,
  },
  selectedImage: {
    width: 100,
    height: 100,
    borderRadius: 8,
  },
  removeImageButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: Colors.light.tint,
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionButtons: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 24,
  },
  actionButtonText: {
    fontSize: 16,
    color: Colors.light.tint,
    marginLeft: 8,
    fontWeight: '500',
  },
  section: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: Colors.light.text,
  },
  inputButton: {
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  inputButtonText: {
    fontSize: 16,
    color: Colors.light.text,
  },
  placeholder: {
    color: Colors.light.secondary,
  },
  ratingsContainer: {
    gap: 16,
  },
  modeToggle: {
    flexDirection: 'row',
    backgroundColor: Colors.light.border,
    padding: 4,
    borderRadius: 10,
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  modeBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  modeBtnActive: {
    backgroundColor: Colors.light.card,
  },
  modeText: {
    color: Colors.light.secondary,
    fontSize: 14,
    fontWeight: '600',
  },
  modeTextActive: {
    color: Colors.light.text,
  },
  quickRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  quickChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.light.border,
    backgroundColor: Colors.light.card,
  },
  quickChipActive: {
    borderColor: Colors.light.tint,
    backgroundColor: Colors.light.accent,
  },
  quickEmoji: {
    fontSize: 18,
  },
  quickLabel: {
    marginLeft: 6,
    fontSize: 14,
    color: Colors.light.secondary,
    fontWeight: '600',
  },
  quickLabelActive: {
    color: Colors.light.tint,
  },
  quickHint: {
    fontSize: 12,
    color: Colors.light.secondary,
  },
  quickFooter: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  overallRow: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  overallLabel: {
    color: Colors.light.secondary,
  },
  overallValue: {
    color: Colors.light.text,
    fontWeight: '700',
  },
  addDetailsBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: Colors.light.tint,
  },
  addDetailsText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '700',
  },
  ratingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ratingLabel: {
    fontSize: 16,
    color: Colors.light.text,
    flex: 1,
  },
  starsContainer: {
    flexDirection: 'row',
  },
  starButton: {
    padding: 4,
  },
  bottomSpacing: {
    height: 32,
  },
  selectedRestaurantInfo: {
    marginTop: 8,
    paddingLeft: 12,
  },
  selectedRestaurantCuisine: {
    fontSize: 14,
    color: Colors.light.tint,
    fontWeight: '500',
  },
  selectedRestaurantAddress: {
    fontSize: 12,
    color: Colors.light.secondary,
    marginTop: 2,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.light.text,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: Colors.light.text,
  },
  restaurantItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  restaurantImage: {
    width: 50,
    height: 50,
    borderRadius: 8,
    marginRight: 12,
  },
  restaurantInfo: {
    flex: 1,
  },
  restaurantName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
  },
  restaurantCuisine: {
    fontSize: 14,
    color: Colors.light.tint,
    marginTop: 2,
  },
  restaurantAddress: {
    fontSize: 12,
    color: Colors.light.secondary,
    marginTop: 2,
  },
  emptyListContainer: {
    padding: 16,
  },
  emptyListText: {
    color: Colors.light.secondary,
  },
});