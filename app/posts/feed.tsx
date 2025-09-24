import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  Modal,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { 
  Heart, 
  MessageSquare, 
  Share2, 
  Bookmark, 
  MoreHorizontal,
  Filter,
  Search,
  TrendingUp,
  Clock,
  Users,
  MapPin,
  Plus,
} from 'lucide-react-native';

import { trpc } from '@/lib/trpc';

import Colors from '@/constants/colors';
import LoadingSpinner from '@/components/LoadingSpinner';
import { Post } from '@/types/restaurant';

interface PostCardProps {
  post: Post;
  onLike: (postId: string) => void;
  onComment: (postId: string) => void;
  onShare: (postId: string) => void;
  onBookmark: (postId: string) => void;
  onUserPress: (userId: string) => void;
  onPostPress: (postId: string) => void;
  onMorePress: (post: Post) => void;
}

const PostCard = React.memo(function PostCard({
  post,
  onLike,
  onComment,
  onShare,
  onBookmark,
  onUserPress,
  onPostPress,
  onMorePress,
}: PostCardProps) {
  return (
    <View style={styles.postCard}>
      {/* Header */}
      <View style={styles.postHeader}>
        <TouchableOpacity 
          style={styles.userInfo}
          onPress={() => onUserPress(post.userId)}
        >
          <Image source={{ uri: post.user.avatar }} style={styles.userAvatar} />
          <View style={styles.userDetails}>
            <Text style={styles.userName}>{post.user.displayName}</Text>
            <View style={styles.postMeta}>
              <Text style={styles.postTime}>
                {new Date(post.createdAt).toLocaleDateString()}
              </Text>
              {post.restaurant && (
                <>
                  <Text style={styles.metaSeparator}>•</Text>
                  <Text style={styles.restaurantName}>{post.restaurant.name}</Text>
                </>
              )}
            </View>
          </View>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => onMorePress(post)}>
          <MoreHorizontal size={20} color={Colors.light.secondary} />
        </TouchableOpacity>
      </View>

      {/* Content */}
      <TouchableOpacity onPress={() => onPostPress(post.id)} activeOpacity={0.95}>
        <Text style={styles.postText}>{post.content.text}</Text>
        
        {post.content.images && post.content.images.length > 0 && (
          <View style={styles.imagesContainer}>
            {post.content.images.slice(0, 3).map((image, index) => (
              <Image
                key={`${post.id}-image-${index}`}
                source={{ uri: image }}
                style={[
                  styles.postImage,
                  post.content.images!.length === 1 && styles.singleImage,
                  post.content.images!.length === 2 && styles.doubleImage,
                  post.content.images!.length >= 3 && styles.tripleImage,
                ]}
                resizeMode="cover"
              />
            ))}
            {post.content.images.length > 3 && (
              <View style={styles.moreImagesOverlay}>
                <Text style={styles.moreImagesText}>+{post.content.images.length - 3}</Text>
              </View>
            )}
          </View>
        )}

        {/* Ratings */}
        {post.ratings && (
          <View style={styles.ratingsContainer}>
            <View style={styles.overallRating}>
              <Text style={styles.ratingValue}>{post.ratings.overall.toFixed(1)}</Text>
              <Text style={styles.ratingLabel}>Overall</Text>
            </View>
            <View style={styles.detailedRatings}>
              <Text style={styles.ratingDetail}>Food: {post.ratings.food}/5</Text>
              <Text style={styles.ratingDetail}>Service: {post.ratings.service}/5</Text>
              <Text style={styles.ratingDetail}>Ambiance: {post.ratings.ambiance}/5</Text>
            </View>
          </View>
        )}

        {/* Tags */}
        {post.tags.length > 0 && (
          <View style={styles.tagsContainer}>
            {post.tags.slice(0, 3).map((tag, index) => (
              <View key={`${post.id}-tag-${tag}-${index}`} style={styles.tag}>
                <Text style={styles.tagText}>#{tag}</Text>
              </View>
            ))}
            {post.tags.length > 3 && (
              <Text style={styles.moreTags}>+{post.tags.length - 3} more</Text>
            )}
          </View>
        )}
      </TouchableOpacity>

      {/* Actions */}
      <View style={styles.actionsContainer}>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => onLike(post.id)}
        >
          <Heart 
            size={20} 
            color={post.isLiked ? Colors.light.error : Colors.light.secondary}
            fill={post.isLiked ? Colors.light.error : 'transparent'}
          />
          <Text style={[styles.actionText, post.isLiked && styles.likedText]}>
            {post.likesCount}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => onComment(post.id)}
        >
          <MessageSquare size={20} color={Colors.light.secondary} />
          <Text style={styles.actionText}>{post.commentsCount}</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => onShare(post.id)}
        >
          <Share2 size={20} color={Colors.light.secondary} />
          <Text style={styles.actionText}>{post.sharesCount}</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => onBookmark(post.id)}
        >
          <Bookmark 
            size={20} 
            color={post.isBookmarked ? Colors.light.tint : Colors.light.secondary}
            fill={post.isBookmarked ? Colors.light.tint : 'transparent'}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
});

type FeedType = 'recent' | 'trending' | 'following' | 'local';

export default function PostFeedScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  
  const [feedType, setFeedType] = useState<FeedType>('recent');
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [showPostOptions, setShowPostOptions] = useState(false);

  const { 
    data: feedData, 
    isLoading,
  } = trpc.posts.feed.useQuery(
    { type: feedType, limit: 20 },
    {
      staleTime: 1000 * 60 * 5,
    }
  );

  const posts = useMemo(() => {
    return feedData?.posts ?? [];
  }, [feedData]);

  const utils = trpc.useUtils();
  
  const likeMutation = trpc.posts.like.useMutation({
    onMutate: async ({ postId }) => {
      // Cancel outgoing refetches
      await utils.posts.feed.cancel({ type: feedType, limit: 20 });
      
      // Snapshot the previous value
      const previousFeed = utils.posts.feed.getData({ type: feedType, limit: 20 });
      
      // Optimistically update
      utils.posts.feed.setData({ type: feedType, limit: 20 }, (old) => {
        if (!old) return old;
        return {
          ...old,
          posts: old.posts.map(post => 
            post.id === postId 
              ? { 
                  ...post, 
                  isLiked: !post.isLiked, 
                  likesCount: post.isLiked ? post.likesCount - 1 : post.likesCount + 1 
                }
              : post
          )
        };
      });
      
      return { previousFeed };
    },
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousFeed) {
        utils.posts.feed.setData({ type: feedType, limit: 20 }, context.previousFeed);
      }
    },
    onSettled: () => {
      // Invalidate to ensure consistency
      utils.posts.feed.invalidate({ type: feedType, limit: 20 });
    }
  });
  
  const bookmarkMutation = trpc.posts.bookmark.useMutation({
    onMutate: async ({ postId }) => {
      await utils.posts.feed.cancel({ type: feedType, limit: 20 });
      const previousFeed = utils.posts.feed.getData({ type: feedType, limit: 20 });
      
      utils.posts.feed.setData({ type: feedType, limit: 20 }, (old) => {
        if (!old) return old;
        return {
          ...old,
          posts: old.posts.map(post => 
            post.id === postId 
              ? { ...post, isBookmarked: !post.isBookmarked }
              : post
          )
        };
      });
      
      return { previousFeed };
    },
    onError: (err, variables, context) => {
      console.error('Bookmark error:', err);
      if (context?.previousFeed) {
        utils.posts.feed.setData({ type: feedType, limit: 20 }, context.previousFeed);
      }
    },
    onSettled: () => {
      utils.posts.feed.invalidate({ type: feedType, limit: 20 });
    }
  });
  
  const shareMutation = trpc.posts.share.useMutation();
  const recordViewMutation = trpc.posts.recordView.useMutation();

  const handleLike = useCallback(async (postId: string) => {
    try {
      await likeMutation.mutateAsync({ postId });
    } catch (error) {
      console.error('Failed to like post:', error);
    }
  }, [likeMutation]);

  const handleComment = useCallback((postId: string) => {
    router.push(`/comments/${postId}`);
  }, [router]);

  const handleShare = useCallback(async (postId: string) => {
    try {
      await shareMutation.mutateAsync({ postId });
      console.log('Post shared successfully');
    } catch (error) {
      console.error('Failed to share post:', error);
    }
  }, [shareMutation]);

  const handleBookmark = useCallback(async (postId: string) => {
    try {
      await bookmarkMutation.mutateAsync({ postId });
    } catch (error) {
      console.error('Failed to bookmark post:', error);
    }
  }, [bookmarkMutation]);

  const handleUserPress = useCallback((userId: string) => {
    router.push(`/users/${userId}`);
  }, [router]);

  const handlePostPress = useCallback(async (postId: string) => {
    try {
      await recordViewMutation.mutateAsync({ postId });
      router.push(`/posts/${postId}`);
    } catch (error) {
      console.error('Failed to record view:', error);
      // Still navigate even if view recording fails
      router.push(`/posts/${postId}`);
    }
  }, [recordViewMutation, router]);

  const handleMorePress = useCallback((post: Post) => {
    setSelectedPost(post);
    setShowPostOptions(true);
  }, []);

  const handlePostOption = useCallback((option: string) => {
    if (!selectedPost) return;
    
    setShowPostOptions(false);
    
    switch (option) {
      case 'report':
        console.log('Report post:', selectedPost.id);
        break;
      case 'hide':
        console.log('Hide post:', selectedPost.id);
        break;
      case 'copy_link':
        console.log('Copy link for post:', selectedPost.id);
        break;
    }
    
    setSelectedPost(null);
  }, [selectedPost]);

  const renderFeedTypeButton = useCallback((type: FeedType, icon: React.ReactNode, label: string) => {
    if (!type || !label) return null;
    return (
      <TouchableOpacity
        key={type}
        style={[styles.feedTypeButton, feedType === type && styles.activeFeedType]}
        onPress={() => setFeedType(type)}
      >
        <Text>{icon}</Text>
        <Text style={[styles.feedTypeText, feedType === type && styles.activeFeedTypeText]}>
          {label}
        </Text>
      </TouchableOpacity>
    );
  }, [feedType]);

  const renderPost = useCallback(({ item }: { item: Post }) => (
    <PostCard
      post={item}
      onLike={handleLike}
      onComment={handleComment}
      onShare={handleShare}
      onBookmark={handleBookmark}
      onUserPress={handleUserPress}
      onPostPress={handlePostPress}
      onMorePress={handleMorePress}
    />
  ), [handleLike, handleComment, handleShare, handleBookmark, handleUserPress, handlePostPress, handleMorePress]);



  if (isLoading) {
    return <LoadingSpinner text="Loading feed..." showGradient />;
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Feed</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={() => console.log('Search posts')}>
            <Search size={24} color={Colors.light.text} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => console.log('Show filters')}>
            <Filter size={24} color={Colors.light.text} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Feed Type Selector */}
      <View style={styles.feedTypeContainer}>
        {renderFeedTypeButton('recent', <Clock size={16} color={feedType === 'recent' ? Colors.light.tint : Colors.light.secondary} />, 'Recent')}
        {renderFeedTypeButton('trending', <TrendingUp size={16} color={feedType === 'trending' ? Colors.light.tint : Colors.light.secondary} />, 'Trending')}
        {renderFeedTypeButton('following', <Users size={16} color={feedType === 'following' ? Colors.light.tint : Colors.light.secondary} />, 'Following')}
        {renderFeedTypeButton('local', <MapPin size={16} color={feedType === 'local' ? Colors.light.tint : Colors.light.secondary} />, 'Local')}
      </View>

      {/* Posts List */}
      <FlatList
        data={posts}
        renderItem={renderPost}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
      />

      {/* Floating Action Button */}
      <TouchableOpacity 
        style={styles.fab}
        onPress={() => router.push('/(tabs)/(home)/create-post')}
        activeOpacity={0.8}
      >
        <Plus size={24} color="white" />
      </TouchableOpacity>

      {/* Post Options Modal */}
      <Modal
        visible={showPostOptions}
        transparent
        animationType="fade"
        onRequestClose={() => setShowPostOptions(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          onPress={() => setShowPostOptions(false)}
        >
          <View style={styles.optionsModal}>
            <TouchableOpacity 
              style={styles.optionButton}
              onPress={() => handlePostOption('report')}
            >
              <Text style={styles.optionText}>Report Post</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.optionButton}
              onPress={() => handlePostOption('hide')}
            >
              <Text style={styles.optionText}>Hide Post</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.optionButton}
              onPress={() => handlePostOption('copy_link')}
            >
              <Text style={styles.optionText}>Copy Link</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.optionButton, styles.cancelButton]}
              onPress={() => setShowPostOptions(false)}
            >
              <Text style={[styles.optionText, styles.cancelText]}>Cancel</Text>
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
    fontSize: 24,
    fontWeight: '700',
    color: Colors.light.text,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 16,
  },
  feedTypeContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  feedTypeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    backgroundColor: Colors.light.card,
  },
  activeFeedType: {
    backgroundColor: Colors.light.tint,
  },
  feedTypeText: {
    marginLeft: 6,
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.secondary,
  },
  activeFeedTypeText: {
    color: 'white',
  },
  listContent: {
    paddingBottom: 20,
  },
  postCard: {
    backgroundColor: Colors.light.card,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  postHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
  },
  postMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  postTime: {
    fontSize: 12,
    color: Colors.light.secondary,
  },
  metaSeparator: {
    fontSize: 12,
    color: Colors.light.secondary,
    marginHorizontal: 6,
  },
  restaurantName: {
    fontSize: 12,
    color: Colors.light.tint,
    fontWeight: '500',
  },
  postText: {
    fontSize: 16,
    lineHeight: 24,
    color: Colors.light.text,
    marginBottom: 12,
  },
  imagesContainer: {
    flexDirection: 'row',
    marginBottom: 12,
    borderRadius: 8,
    overflow: 'hidden',
  },
  postImage: {
    backgroundColor: Colors.light.border,
  },
  singleImage: {
    width: '100%',
    height: 200,
  },
  doubleImage: {
    width: '49%',
    height: 150,
    marginRight: '2%',
  },
  tripleImage: {
    width: '32%',
    height: 120,
    marginRight: '2%',
  },
  moreImagesOverlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: '32%',
    height: 120,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  moreImagesText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  ratingsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    padding: 12,
    backgroundColor: Colors.light.accent,
    borderRadius: 8,
  },
  overallRating: {
    alignItems: 'center',
    marginRight: 16,
  },
  ratingValue: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.light.tint,
  },
  ratingLabel: {
    fontSize: 12,
    color: Colors.light.secondary,
  },
  detailedRatings: {
    flex: 1,
  },
  ratingDetail: {
    fontSize: 12,
    color: Colors.light.text,
    marginBottom: 2,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  tag: {
    backgroundColor: Colors.light.border,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
    marginBottom: 4,
  },
  tagText: {
    fontSize: 12,
    color: Colors.light.tint,
    fontWeight: '500',
  },
  moreTags: {
    fontSize: 12,
    color: Colors.light.secondary,
    alignSelf: 'center',
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    paddingVertical: 8,
  },
  actionText: {
    marginLeft: 6,
    fontSize: 14,
    color: Colors.light.secondary,
    fontWeight: '500',
  },
  likedText: {
    color: Colors.light.error,
  },
  loadingFooter: {
    paddingVertical: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  optionsModal: {
    backgroundColor: Colors.light.card,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingVertical: 20,
  },
  optionButton: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  optionText: {
    fontSize: 16,
    color: Colors.light.text,
    textAlign: 'center',
  },
  cancelButton: {
    borderBottomWidth: 0,
    marginTop: 8,
  },
  cancelText: {
    color: Colors.light.error,
    fontWeight: '600',
  },
  fab: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.light.tint,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
});