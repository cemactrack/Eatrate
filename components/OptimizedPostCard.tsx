import React, { memo, useMemo } from 'react';
import { View, Text, StyleSheet, Pressable, Image } from 'react-native';
import { Heart, MessageCircle, Share, Bookmark } from 'lucide-react-native';
import { useSettings } from '@/providers/SettingsProvider';
import { useStableCallback } from '@/utils/performance';

interface PostData {
  id: string;
  title: string;
  content: string;
  author: {
    id: string;
    name: string;
    avatar?: string;
  };
  image?: string;
  likes: number;
  comments: number;
  isLiked: boolean;
  isBookmarked: boolean;
  createdAt: string;
}

interface OptimizedPostCardProps {
  post: PostData;
  onLike: (postId: string) => void;
  onComment: (postId: string) => void;
  onShare: (postId: string) => void;
  onBookmark: (postId: string) => void;
  onPress: (postId: string) => void;
}

const OptimizedPostCard: React.FC<OptimizedPostCardProps> = ({
  post,
  onLike,
  onComment,
  onShare,
  onBookmark,
  onPress,
}) => {
  const { colors } = useSettings();
  
  // Stable callbacks to prevent unnecessary re-renders
  const handleLike = useStableCallback(() => onLike(post.id));
  const handleComment = useStableCallback(() => onComment(post.id));
  const handleShare = useStableCallback(() => onShare(post.id));
  const handleBookmark = useStableCallback(() => onBookmark(post.id));
  const handlePress = useStableCallback(() => onPress(post.id));
  
  // Memoized styles
  const styles = useMemo(() => createStyles(colors), [colors]);
  
  // Memoized formatted date
  const formattedDate = useMemo(() => {
    const date = new Date(post.createdAt);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }, [post.createdAt]);
  
  return (
    <Pressable
      style={styles.container}
      onPress={handlePress}
      android_ripple={{ color: colors.accent }}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.authorInfo}>
          {post.author.avatar ? (
            <Image source={{ uri: post.author.avatar }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarPlaceholder]}>
              <Text style={styles.avatarText}>
                {post.author.name.charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
          <View style={styles.authorDetails}>
            <Text style={styles.authorName}>{post.author.name}</Text>
            <Text style={styles.timestamp}>{formattedDate}</Text>
          </View>
        </View>
      </View>
      
      {/* Content */}
      <View style={styles.content}>
        <Text style={styles.title}>{post.title}</Text>
        <Text style={styles.description} numberOfLines={3}>
          {post.content}
        </Text>
      </View>
      
      {/* Image */}
      {post.image && (
        <Image
          source={{ uri: post.image }}
          style={styles.postImage}
          resizeMode="cover"
        />
      )}
      
      {/* Actions */}
      <View style={styles.actions}>
        <Pressable
          style={styles.actionButton}
          onPress={handleLike}
          android_ripple={{ color: colors.accent, radius: 20 }}
        >
          <Heart
            size={20}
            color={post.isLiked ? colors.error : colors.secondary}
            fill={post.isLiked ? colors.error : 'transparent'}
          />
          <Text style={[styles.actionText, post.isLiked && { color: colors.error }]}>
            {post.likes}
          </Text>
        </Pressable>
        
        <Pressable
          style={styles.actionButton}
          onPress={handleComment}
          android_ripple={{ color: colors.accent, radius: 20 }}
        >
          <MessageCircle size={20} color={colors.secondary} />
          <Text style={styles.actionText}>{post.comments}</Text>
        </Pressable>
        
        <Pressable
          style={styles.actionButton}
          onPress={handleShare}
          android_ripple={{ color: colors.accent, radius: 20 }}
        >
          <Share size={20} color={colors.secondary} />
        </Pressable>
        
        <View style={styles.spacer} />
        
        <Pressable
          style={styles.actionButton}
          onPress={handleBookmark}
          android_ripple={{ color: colors.accent, radius: 20 }}
        >
          <Bookmark
            size={20}
            color={post.isBookmarked ? colors.tint : colors.secondary}
            fill={post.isBookmarked ? colors.tint : 'transparent'}
          />
        </Pressable>
      </View>
    </Pressable>
  );
};

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    backgroundColor: colors.background,
    borderRadius: 12,
    marginVertical: 6,
    marginHorizontal: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  authorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  avatarPlaceholder: {
    backgroundColor: colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
  authorDetails: {
    flex: 1,
  },
  authorName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2,
  },
  timestamp: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  content: {
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
    lineHeight: 24,
  },
  description: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  postImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginBottom: 12,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 20,
    marginRight: 16,
  },
  actionText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginLeft: 4,
    fontWeight: '500',
  },
  spacer: {
    flex: 1,
  },
});

// Memoize the component with custom comparison
export default memo(OptimizedPostCard, (prevProps, nextProps) => {
  // Only re-render if essential props change
  return (
    prevProps.post.id === nextProps.post.id &&
    prevProps.post.likes === nextProps.post.likes &&
    prevProps.post.comments === nextProps.post.comments &&
    prevProps.post.isLiked === nextProps.post.isLiked &&
    prevProps.post.isBookmarked === nextProps.post.isBookmarked
  );
});