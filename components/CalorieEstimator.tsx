import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Camera, Zap, Info } from 'lucide-react-native';
import { trpc } from '@/lib/trpc';
import { useSettings } from '@/providers/SettingsProvider';
import { useLocalization } from '@/providers/LocalizationProvider';
import { useGamificationTracker } from '@/providers/GamificationProvider';
import { NutritionInfo, CalorieEstimationResponse, DIETARY_TAGS } from '@/types/nutrition';

interface CalorieEstimatorProps {
  onEstimationComplete?: (nutrition: NutritionInfo) => void;
  dishName?: string;
  restaurantContext?: string;
}

export default function CalorieEstimator({
  onEstimationComplete,
  dishName,
  restaurantContext,
}: CalorieEstimatorProps) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [nutritionData, setNutritionData] = useState<CalorieEstimationResponse | null>(null);
  const { colors } = useSettings();
  const { t } = useLocalization();
  const { trackPhoto } = useGamificationTracker();

  const estimateCaloriesMutation = trpc.nutrition.estimateCalories.useMutation();

  const requestPermissions = async () => {
    if (Platform.OS !== 'web') {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'We need camera roll permissions to analyze food photos.',
          [{ text: 'OK' }]
        );
        return false;
      }
    }
    return true;
  };

  const pickImage = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        setSelectedImage(asset.uri);
        
        if (asset.base64) {
          await analyzeImage(asset.base64);
        }
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };

  const takePhoto = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'We need camera permissions to take food photos.',
          [{ text: 'OK' }]
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        setSelectedImage(asset.uri);
        
        if (asset.base64) {
          await analyzeImage(asset.base64);
          trackPhoto(); // Track photo upload for gamification
        }
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo. Please try again.');
    }
  };

  const analyzeImage = async (base64Image: string) => {
    setIsAnalyzing(true);
    try {
      const result = await estimateCaloriesMutation.mutateAsync({
        imageBase64: base64Image,
        dishName,
        restaurantContext,
      });

      setNutritionData(result);
      if (onEstimationComplete) {
        onEstimationComplete(result.nutrition);
      }
    } catch (error) {
      console.error('Failed to analyze image:', error);
      Alert.alert(
        'Analysis Failed',
        'Unable to analyze the food image. Please try again with a clearer photo.'
      );
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getDietaryTagColor = (tagId: string) => {
    const tag = DIETARY_TAGS.find(t => t.id === tagId);
    return tag?.color || colors.tint;
  };

  const getDietaryTagIcon = (tagId: string) => {
    const tag = DIETARY_TAGS.find(t => t.id === tagId);
    return tag?.icon || '🏷️';
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Zap size={24} color={colors.tint} />
          <Text style={[styles.title, { color: colors.text }]}>
            AI Calorie Estimator
          </Text>
        </View>
        <TouchableOpacity style={styles.infoButton}>
          <Info size={20} color={colors.secondary} />
        </TouchableOpacity>
      </View>

      {!selectedImage ? (
        <View style={styles.uploadContainer}>
          <View style={[styles.uploadArea, { borderColor: colors.border }]}>
            <Camera size={48} color={colors.secondary} />
            <Text style={[styles.uploadTitle, { color: colors.text }]}>
              Add a food photo to get nutrition info
            </Text>
            <Text style={[styles.uploadSubtitle, { color: colors.secondary }]}>
              Our AI will analyze the image and estimate calories and nutrients
            </Text>
          </View>

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: colors.tint }]}
              onPress={takePhoto}
            >
              <Camera size={20} color="#fff" />
              <Text style={styles.actionButtonText}>Take Photo</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: colors.accent, borderColor: colors.tint }]}
              onPress={pickImage}
            >
              <Text style={[styles.actionButtonText, { color: colors.tint }]}>
                Choose from Gallery
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <View style={styles.analysisContainer}>
          <Image source={{ uri: selectedImage }} style={styles.selectedImage} />

          {isAnalyzing ? (
            <View style={styles.analyzingContainer}>
              <ActivityIndicator size="large" color={colors.tint} />
              <Text style={[styles.analyzingText, { color: colors.text }]}>
                Analyzing your food photo...
              </Text>
              <Text style={[styles.analyzingSubtext, { color: colors.secondary }]}>
                This may take a few seconds
              </Text>
            </View>
          ) : nutritionData ? (
            <View style={styles.resultsContainer}>
              <View style={styles.recognitionContainer}>
                <Text style={[styles.recognizedFood, { color: colors.text }]}>
                  {nutritionData.recognizedFood.name}
                </Text>
                <Text style={[styles.confidence, { color: colors.secondary }]}>
                  {Math.round(nutritionData.recognizedFood.confidence * 100)}% confidence
                </Text>
              </View>

              <View style={[styles.calorieCard, { backgroundColor: colors.tint }]}>
                <Text style={styles.calorieNumber}>
                  {nutritionData.nutrition.calories}
                </Text>
                <Text style={styles.calorieLabel}>Estimated Calories</Text>
              </View>

              <View style={styles.macrosContainer}>
                <Text style={[styles.macrosTitle, { color: colors.text }]}>
                  Macronutrients
                </Text>
                <View style={styles.macrosGrid}>
                  <View style={[styles.macroItem, { backgroundColor: colors.background, borderColor: colors.border }]}>
                    <Text style={[styles.macroValue, { color: colors.text }]}>
                      {nutritionData.nutrition.macros.protein}g
                    </Text>
                    <Text style={[styles.macroLabel, { color: colors.secondary }]}>
                      {t('food.protein')}
                    </Text>
                  </View>
                  <View style={[styles.macroItem, { backgroundColor: colors.background, borderColor: colors.border }]}>
                    <Text style={[styles.macroValue, { color: colors.text }]}>
                      {nutritionData.nutrition.macros.carbs}g
                    </Text>
                    <Text style={[styles.macroLabel, { color: colors.secondary }]}>
                      {t('food.carbs')}
                    </Text>
                  </View>
                  <View style={[styles.macroItem, { backgroundColor: colors.background, borderColor: colors.border }]}>
                    <Text style={[styles.macroValue, { color: colors.text }]}>
                      {nutritionData.nutrition.macros.fat}g
                    </Text>
                    <Text style={[styles.macroLabel, { color: colors.secondary }]}>
                      {t('food.fat')}
                    </Text>
                  </View>
                  <View style={[styles.macroItem, { backgroundColor: colors.background, borderColor: colors.border }]}>
                    <Text style={[styles.macroValue, { color: colors.text }]}>
                      {nutritionData.nutrition.macros.fiber}g
                    </Text>
                    <Text style={[styles.macroLabel, { color: colors.secondary }]}>
                      {t('food.fiber')}
                    </Text>
                  </View>
                </View>
              </View>

              {nutritionData.nutrition.dietaryTags.length > 0 && (
                <View style={styles.tagsContainer}>
                  <Text style={[styles.tagsTitle, { color: colors.text }]}>
                    Dietary Information
                  </Text>
                  <View style={styles.tagsGrid}>
                    {nutritionData.nutrition.dietaryTags.map((tag) => (
                      <View
                        key={tag.id}
                        style={[
                          styles.dietaryTag,
                          { backgroundColor: getDietaryTagColor(tag.id) + '20', borderColor: getDietaryTagColor(tag.id) }
                        ]}
                      >
                        <Text style={styles.dietaryTagIcon}>
                          {getDietaryTagIcon(tag.id)}
                        </Text>
                        <Text style={[styles.dietaryTagText, { color: getDietaryTagColor(tag.id) }]}>
                          {tag.name}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              <View style={styles.confidenceContainer}>
                <Text style={[styles.confidenceText, { color: colors.secondary }]}>
                  Analysis confidence: {Math.round(nutritionData.nutrition.confidence * 100)}%
                </Text>
                <Text style={[styles.disclaimerText, { color: colors.secondary }]}>
                  Estimates are approximate and may vary based on preparation and serving size.
                </Text>
              </View>

              <TouchableOpacity
                style={[styles.retryButton, { backgroundColor: colors.accent, borderColor: colors.tint }]}
                onPress={() => {
                  setSelectedImage(null);
                  setNutritionData(null);
                }}
              >
                <Text style={[styles.retryButtonText, { color: colors.tint }]}>
                  Analyze Another Photo
                </Text>
              </TouchableOpacity>
            </View>
          ) : null}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    borderRadius: 16,
    marginVertical: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
  },
  infoButton: {
    padding: 4,
  },
  uploadContainer: {
    gap: 16,
  },
  uploadArea: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
    gap: 12,
  },
  uploadTitle: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  uploadSubtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  buttonContainer: {
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 8,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  analysisContainer: {
    gap: 16,
  },
  selectedImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    resizeMode: 'cover',
  },
  analyzingContainer: {
    alignItems: 'center',
    paddingVertical: 24,
    gap: 12,
  },
  analyzingText: {
    fontSize: 16,
    fontWeight: '600',
  },
  analyzingSubtext: {
    fontSize: 14,
  },
  resultsContainer: {
    gap: 16,
  },
  recognitionContainer: {
    alignItems: 'center',
    gap: 4,
  },
  recognizedFood: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
  },
  confidence: {
    fontSize: 14,
  },
  calorieCard: {
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    gap: 4,
  },
  calorieNumber: {
    fontSize: 36,
    fontWeight: '700',
    color: '#fff',
  },
  calorieLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.9)',
  },
  macrosContainer: {
    gap: 12,
  },
  macrosTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  macrosGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  macroItem: {
    flex: 1,
    minWidth: '45%',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    gap: 4,
  },
  macroValue: {
    fontSize: 18,
    fontWeight: '700',
  },
  macroLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  tagsContainer: {
    gap: 12,
  },
  tagsTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  tagsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  dietaryTag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    gap: 4,
  },
  dietaryTagIcon: {
    fontSize: 14,
  },
  dietaryTagText: {
    fontSize: 12,
    fontWeight: '600',
  },
  confidenceContainer: {
    alignItems: 'center',
    gap: 8,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
  },
  confidenceText: {
    fontSize: 14,
    fontWeight: '500',
  },
  disclaimerText: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 16,
  },
  retryButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});