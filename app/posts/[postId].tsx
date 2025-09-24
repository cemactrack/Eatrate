import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Modal,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { 
  Heart, 
  MessageSquare, 
  Share2, 
  Bookmark, 
  ArrowLeft,
  MoreHorizontal,
  MapPin,
  Calendar,
  Eye,
} from 'lucide-react-native';

import { trpc } from '@/lib/trpc';
import Colors from '@/constants/colors';
import LoadingSpinner from '@/components/LoadingSpinner';

export default function PostDetailScreen() {
  const router = useRouter();
  const { postId } = useLocalSearchParams<{ postId: string }>();
  const insets = useSafeAreaInsets();
  
  const [showShareModal, setShowShareModal] = useState(false);

  const { data: postData, isLoading, error } = trpc.posts.details.useQuery(
    { postId: postId || '' },
    { 
      enabled: !!postId,
      retry: 2,
      staleTime: 1000 * 60 * 5
    }
  );

  const utils = trpc.useUtils();
  
  const likeMutation = trpc.posts.like.useMutation({
    onMutate: async ({ postId: mutationPostId }) => {
      await utils.posts.details.cancel({ postId: postId || '' });
      const previousData = utils.posts.details.getData({ postId: postId || '' });
      
      utils.posts.details.setData({ postId: postId || '' }, (old) => {
        if (!old?.post) return old;
        return {
          ...old,
          post: {
            ...old.post,
            isLiked: !old.post.isLiked,
            likesCount: old.post.isLiked ? old.post.likesCount - 1 : old.post.likesCount + 1
          }
        };
      });
      
      return { previousData };
    },
    onError: (err, variables, context) => {
      console.error('Like error:', err);
      if (context?.previousData) {
        utils.posts.details.setData({ postId: postId || '' }, context.previousData);
      }
    },
    onSettled: () => {
      utils.posts.details.invalidate({ postId: postId || '' });
    }
  });
  
  const bookmarkMutation = trpc.posts.bookmark.useMutation({
    onMutate: async ({ postId: mutationPostId }) => {
      await utils.posts.details.cancel({ postId: postId || '' });
      const previousData = utils.posts.details.getData({ postId: postId || '' });
      
      utils.posts.details.setData({ postId: postId || '' }, (old) => {
        if (!old?.post) return old;
        return {
          ...old,
          post: {
            ...old.post,
            isBookmarked: !old.post.isBookmarked
          }
        };
      });
      
      return { previousData };
    },
    onError: (err, variables, context) => {
      console.error('Bookmark error:', err);
      if (context?.previousData) {
        utils.posts.details.setData({ postId: postId || '' }, context.previousData);
      }
    },
    onSettled: () => {
      utils.posts.details.invalidate({ postId: postId || '' });
    }
  });
  
  const shareMutation = trpc.posts.share.useMutation();

  const handleLike = useCallback(async () => {
    if (!postData?.post) return;
    try {
      await likeMutation.mutateAsync({ postId: postData.post.id });
    } catch (error) {
      console.error('Failed to like post:', error);
    }
  }, [likeMutation, postData?.post]);

  const handleBookmark = useCallback(async () => {
    if (!postData?.post) return;
    try {
      await bookmarkMutation.mutateAsync({ postId: postData.post.id });
    } catch (error) {
      console.error('Failed to bookmark post:', error);
    }
  }, [bookmarkMutation, postData?.post]);

  const handleShare = useCallback(async (platform?: string) => {
    if (!postData?.post) return;
    try {
      await shareMutation.mutateAsync({ 
        postId: postData.post.id,
        platform: platform as any
      });
      setShowShareModal(false);
      console.log('Post shared successfully');
    } catch (error) {
      console.error('Failed to share post:', error);
    }
  }, [shareMutation, postData?.post]);

  const handleComment = useCallback(() => {
    if (!postData?.post) return;
    router.push(`/comments/${postData.post.id}`);
  }, [router, postData?.post]);

  const handleUserPress = useCallback(() => {
    if (!postData?.post) return;
    router.push(`/users/${postData.post.userId}`);
  }, [router, postData?.post]);

  if (isLoading) {
    return <LoadingSpinner text="Loading post..." showGradient />;
  }

  if (error || !postData?.post) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <ArrowLeft size={24} color={Colors.light.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Post</Text>
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>
            {error ? 'Failed to load post' : 'Post not found'}
          </Text>
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={() => router.back()}
          >
            <Text style={styles.retryButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const post = postData.post;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <ArrowLeft size={24} color={Colors.light.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Post</Text>
        <TouchableOpacity>
          <MoreHorizontal size={24} color={Colors.light.text} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* User Info */}
        <TouchableOpacity style={styles.userSection} onPress={handleUserPress}>
          <Image source={{ uri: post.user.avatar }} style={styles.userAvatar} />
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{post.user.displayName}</Text>
            <Text style={styles.userBio}>{post.user.bio}</Text>
            <View style={styles.userStats}>
              <Text style={styles.userStat}>{post.user.followersCount} followers</Text>
              <Text style={styles.userStatSeparator}>•</Text>
              <Text style={styles.userStat}>{post.user.postsCount} posts</Text>
            </View>
          </View>
          {post.user.badges.length > 0 && (
            <View style={styles.badgesContainer}>
              {post.user.badges.map((badge, index) => (
                <View key={`${post.user.id}-badge-${badge}-${index}`} style={styles.badge}>
                  <Text style={styles.badgeText}>{badge}</Text>
                </View>
              ))}
            </View>
          )}
        </TouchableOpacity>

        {/* Post Content */}
        <View style={styles.postContent}>
          <Text style={styles.postText}>{post.content.text}</Text>
          
          {/* Images */}
          {post.content.images && post.content.images.length > 0 && (
            <View style={styles.imagesContainer}>
              {post.content.images.map((image, index) => (
                <Image
                  key={`${post.id}-image-${index}`}
                  source={{ uri: image }}
                  style={styles.postImage}
                  resizeMode="cover"
                />
              ))}
            </View>
          )}

          {/* Restaurant Info */}
          {post.restaurant && (
            <View style={styles.restaurantInfo}>
              <MapPin size={16} color={Colors.light.tint} />
              <Text style={styles.restaurantName}>{post.restaurant.name}</Text>
              <Text style={styles.restaurantLocation}>{post.restaurant.location}</Text>
            </View>
          )}

          {/* Ratings */}
          {post.ratings && (
            <View style={styles.ratingsSection}>
              <Text style={styles.sectionTitle}>Ratings</Text>
              <View style={styles.ratingsGrid}>
                <View style={styles.ratingItem}>
                  <Text style={styles.ratingLabel}>Food</Text>
                  <Text style={styles.ratingValue}>{post.ratings.food}/5</Text>
                </View>
                <View style={styles.ratingItem}>
                  <Text style={styles.ratingLabel}>Service</Text>
                  <Text style={styles.ratingValue}>{post.ratings.service}/5</Text>
                </View>
                <View style={styles.ratingItem}>
                  <Text style={styles.ratingLabel}>Ambiance</Text>
                  <Text style={styles.ratingValue}>{post.ratings.ambiance}/5</Text>
                </View>
                <View style={styles.ratingItem}>
                  <Text style={styles.ratingLabel}>Cleanliness</Text>
                  <Text style={styles.ratingValue}>{post.ratings.cleanliness}/5</Text>
                </View>
              </View>
              <View style={styles.overallRating}>
                <Text style={styles.overallLabel}>Overall Rating</Text>
                <Text style={styles.overallValue}>{post.ratings.overall.toFixed(1)}/5</Text>
              </View>
            </View>
          )}

          {/* Tags */}
          {post.tags.length > 0 && (
            <View style={styles.tagsSection}>
              <Text style={styles.sectionTitle}>Tags</Text>
              <View style={styles.tagsContainer}>
                {post.tags.map((tag, index) => (
                  <View key={`${post.id}-tag-${tag}-${index}`} style={styles.tag}>
                    <Text style={styles.tagText}>#{tag}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Post Meta */}
          <View style={styles.postMeta}>
            <View style={styles.metaItem}>
              <Calendar size={16} color={Colors.light.secondary} />
              <Text style={styles.metaText}>
                {new Date(post.createdAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </Text>
            </View>
            <View style={styles.metaItem}>
              <Eye size={16} color={Colors.light.secondary} />
              <Text style={styles.metaText}>{post.viewsCount} views</Text>
            </View>
          </View>
        </View>

        {/* Engagement Stats */}
        <View style={styles.engagementStats}>
          <Text style={styles.engagementText}>{post.likesCount} likes</Text>
          <Text style={styles.engagementText}>{post.commentsCount} comments</Text>
          <Text style={styles.engagementText}>{post.sharesCount} shares</Text>
        </View>

        {/* Actions */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity style={styles.actionButton} onPress={handleLike}>
            <Heart 
              size={24} 
              color={post.isLiked ? Colors.light.error : Colors.light.secondary}
              fill={post.isLiked ? Colors.light.error : 'transparent'}
            />
            <Text style={[styles.actionText, post.isLiked && styles.likedText]}>Like</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton} onPress={handleComment}>
            <MessageSquare size={24} color={Colors.light.secondary} />
            <Text style={styles.actionText}>Comment</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton} onPress={() => setShowShareModal(true)}>
            <Share2 size={24} color={Colors.light.secondary} />
            <Text style={styles.actionText}>Share</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton} onPress={handleBookmark}>
            <Bookmark 
              size={24} 
              color={post.isBookmarked ? Colors.light.tint : Colors.light.secondary}
              fill={post.isBookmarked ? Colors.light.tint : 'transparent'}
            />
            <Text style={[styles.actionText, post.isBookmarked && styles.bookmarkedText]}>Save</Text>
          </TouchableOpacity>
        </View>

        {/* Related Posts */}
        {postData.post.relatedPosts && postData.post.relatedPosts.length > 0 && (
          <View style={styles.relatedSection}>
            <Text style={styles.sectionTitle}>Related Posts</Text>
            {postData.post.relatedPosts.map((relatedPost, index) => (
              <TouchableOpacity key={`related-${relatedPost.id}-${index}`} style={styles.relatedPost}>
                <Image source={{ uri: relatedPost.content.images?.[0] }} style={styles.relatedImage} />
                <View style={styles.relatedContent}>
                  <Text style={styles.relatedText} numberOfLines={2}>
                    {relatedPost.content.text}
                  </Text>
                  <Text style={styles.relatedAuthor}>{relatedPost.user.displayName}</Text>
                  <Text style={styles.relatedMeta}>
                    {relatedPost.likesCount} likes • {new Date(relatedPost.createdAt).toLocaleDateString()}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Share Modal */}
      <Modal
        visible={showShareModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowShareModal(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          onPress={() => setShowShareModal(false)}
        >
          <View style={styles.shareModal}>
            <Text style={styles.shareTitle}>Share Post</Text>
            <View style={styles.shareOptions}>
              <TouchableOpacity 
                style={styles.shareOption}
                onPress={() => handleShare('facebook')}
              >
                <Text style={styles.shareOptionText}>Facebook</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.shareOption}
                onPress={() => handleShare('twitter')}
              >
                <Text style={styles.shareOptionText}>Twitter</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.shareOption}
                onPress={() => handleShare('whatsapp')}
              >
                <Text style={styles.shareOptionText}>WhatsApp</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.shareOption}
                onPress={() => handleShare('copy_link')}
              >
                <Text style={styles.shareOptionText}>Copy Link</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity 
              style={styles.cancelButton}
              onPress={() => setShowShareModal(false)}
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
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
    fontSize: 18,
    fontWeight: '600',
    color: Colors.light.text,
  },
  content: {
    flex: 1,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    color: Colors.light.secondary,
  },
  userSection: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  userAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 12,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 4,
  },
  userBio: {
    fontSize: 14,
    color: Colors.light.secondary,
    marginBottom: 6,
  },
  userStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userStat: {
    fontSize: 12,
    color: Colors.light.secondary,
  },
  userStatSeparator: {
    fontSize: 12,
    color: Colors.light.secondary,
    marginHorizontal: 8,
  },
  badgesContainer: {
    alignItems: 'flex-end',
  },
  badge: {
    backgroundColor: Colors.light.accent,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 4,
  },
  badgeText: {
    fontSize: 10,
    color: Colors.light.tint,
    fontWeight: '600',
  },
  postContent: {
    padding: 16,
  },
  postText: {
    fontSize: 16,
    lineHeight: 24,
    color: Colors.light.text,
    marginBottom: 16,
  },
  imagesContainer: {
    marginBottom: 16,
  },
  postImage: {
    width: '100%',
    height: 300,
    borderRadius: 12,
    marginBottom: 8,
  },
  restaurantInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.card,
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  restaurantName: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.text,
    marginLeft: 8,
  },
  restaurantLocation: {
    fontSize: 12,
    color: Colors.light.secondary,
    marginLeft: 8,
  },
  ratingsSection: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 12,
  },
  ratingsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  ratingItem: {
    width: '50%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: Colors.light.card,
    borderRadius: 8,
    marginBottom: 8,
    marginRight: 8,
  },
  ratingLabel: {
    fontSize: 14,
    color: Colors.light.text,
  },
  ratingValue: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.tint,
  },
  overallRating: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.light.accent,
    padding: 16,
    borderRadius: 8,
  },
  overallLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
  },
  overallValue: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.light.tint,
  },
  tagsSection: {
    marginBottom: 16,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  tag: {
    backgroundColor: Colors.light.border,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  tagText: {
    fontSize: 12,
    color: Colors.light.tint,
    fontWeight: '500',
  },
  postMeta: {
    marginBottom: 16,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  metaText: {
    fontSize: 12,
    color: Colors.light.secondary,
    marginLeft: 8,
  },
  engagementStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 16,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: Colors.light.border,
    marginHorizontal: 16,
  },
  engagementText: {
    fontSize: 14,
    color: Colors.light.secondary,
    fontWeight: '500',
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 16,
    marginHorizontal: 16,
  },
  actionButton: {
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  actionText: {
    fontSize: 12,
    color: Colors.light.secondary,
    marginTop: 4,
    fontWeight: '500',
  },
  likedText: {
    color: Colors.light.error,
  },
  bookmarkedText: {
    color: Colors.light.tint,
  },
  relatedSection: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
  },
  relatedPost: {
    flexDirection: 'row',
    backgroundColor: Colors.light.card,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  relatedImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 12,
  },
  relatedContent: {
    flex: 1,
  },
  relatedText: {
    fontSize: 14,
    color: Colors.light.text,
    marginBottom: 4,
  },
  relatedAuthor: {
    fontSize: 12,
    color: Colors.light.tint,
    fontWeight: '500',
    marginBottom: 2,
  },
  relatedMeta: {
    fontSize: 10,
    color: Colors.light.secondary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  shareModal: {
    backgroundColor: Colors.light.card,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingVertical: 20,
  },
  shareTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.light.text,
    textAlign: 'center',
    marginBottom: 20,
  },
  shareOptions: {
    paddingHorizontal: 20,
  },
  shareOption: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  shareOptionText: {
    fontSize: 16,
    color: Colors.light.text,
    textAlign: 'center',
  },
  cancelButton: {
    paddingVertical: 16,
    marginTop: 8,
  },
  cancelText: {
    fontSize: 16,
    color: Colors.light.error,
    fontWeight: '600',
    textAlign: 'center',
  },
  headerSpacer: {
    width: 24,
  },
  retryButton: {
    backgroundColor: Colors.light.tint,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 16,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});