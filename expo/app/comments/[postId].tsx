import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, Image } from 'react-native';

import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import Colors from '@/constants/colors';

import { Heart, Send } from 'lucide-react-native';
import { useAuth } from '@/providers/AuthProvider';
import { trpc } from '@/lib/trpc';
import LoadingSpinner from '@/components/LoadingSpinner';

interface CommentItem {
  id: string;
  user: {
    id: string;
    name: string;
    avatar: string;
  };
  text: string;
  createdAt: string;
  likesCount: number;
  isLiked: boolean;
}

export default function CommentsSheet() {
  const insets = useSafeAreaInsets();
  const authContext = useAuth();
  const { user } = authContext || { user: null };
  const { postId } = useLocalSearchParams<{ postId: string }>();
  const [text, setText] = useState<string>('');
  const [comments, setComments] = useState<CommentItem[]>([]);

  const { data: commentsData, isLoading, error } = trpc.comments.list.useQuery(
    { postId: postId || '' },
    { enabled: !!postId, staleTime: 1000 * 60 * 2 }
  );

  useEffect(() => {
    if (commentsData?.comments) {
      const mappedComments: CommentItem[] = commentsData.comments.map((comment: any) => ({
        id: comment.id,
        user: {
          id: comment.user.id,
          name: comment.user.displayName,
          avatar: comment.user.avatar,
        },
        text: comment.text,
        createdAt: comment.createdAt,
        likesCount: comment.likesCount,
        isLiked: comment.isLiked,
      }));
      setComments(prev => {
        // Only update if the data has actually changed
        if (JSON.stringify(prev) !== JSON.stringify(mappedComments)) {
          return mappedComments;
        }
        return prev;
      });
    }
  }, [commentsData?.comments]);

  const createMutation = trpc.comments.create.useMutation();

  const send = useCallback(async () => {
    const trimmed = text.trim();
    if (!trimmed || !user || !postId) return;

    const optimistic: CommentItem = {
      id: `c${Date.now()}`,
      user: {
        id: user.id,
        name: user.displayName,
        avatar: user.avatar || 'https://images.unsplash.com/photo-1544435253-f0ead49638b9?w=200&h=200&fit=crop',
      },
      text: trimmed,
      createdAt: new Date().toISOString(),
      likesCount: 0,
      isLiked: false,
    };

    setComments(prev => [optimistic, ...prev]);
    setText('');

    try {
      const created = await createMutation.mutateAsync({ postId: String(postId), text: trimmed });
      setComments(prev => prev.map(c => (c.id === optimistic.id ? { ...optimistic, id: created.id } : c)));
      console.log('[Comments] Created comment on server');
    } catch (e) {
      console.log('[Comments] Failed to create comment', e);
      setComments(prev => prev.filter(c => c.id !== optimistic.id));
    }
  }, [text, user, postId, createMutation]);

  const handleLikeComment = (commentId: string) => {
    setComments(prev => prev.map(comment => 
      comment.id === commentId
        ? {
            ...comment,
            isLiked: !comment.isLiked,
            likesCount: comment.isLiked ? comment.likesCount - 1 : comment.likesCount + 1,
          }
        : comment
    ));
  };

  const renderComment = ({ item }: { item: CommentItem }) => (
    <View style={styles.commentRow} testID={`comment-${item.id}`}>
      <Image source={{ uri: item.user.avatar }} style={styles.commentAvatar} />
      <View style={styles.commentContent}>
        <View style={styles.commentHeader}>
          <Text style={styles.commentAuthor}>{item.user.name}</Text>
          <Text style={styles.commentTime}>{new Date(item.createdAt).toLocaleString()}</Text>
        </View>
        <Text style={styles.commentText}>{item.text}</Text>
        <TouchableOpacity
          style={styles.likeButton}
          onPress={() => handleLikeComment(item.id)}
          testID={`like-${item.id}`}
        >
          <Heart
            size={14}
            color={item.isLiked ? Colors.light.tint : Colors.light.secondary}
            fill={item.isLiked ? Colors.light.tint : 'transparent'}
          />
          {item.likesCount > 0 && (
            <Text style={[styles.likeCount, item.isLiked && styles.likeCountActive]}>
              {item.likesCount}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );

  if (isLoading) {
    return <LoadingSpinner text="Loading comments..." />;
  }

  return (
    <KeyboardAvoidingView style={[styles.container, { paddingTop: insets.top }]} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.header}>
        <Text style={styles.title}>Comments</Text>
        <Text style={styles.subtitle}>Share your thoughts</Text>
        {error && (
          <Text style={styles.errorText}>Failed to load comments</Text>
        )}
      </View>
      <FlatList
        data={comments}
        keyExtractor={(item) => item.id}
        renderItem={renderComment}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>No comments yet</Text>
            <Text style={styles.emptyStateSubtext}>Be the first to share your thoughts!</Text>
          </View>
        }
      />
      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          placeholder="Add a comment..."
          placeholderTextColor={Colors.light.secondary}
          value={text}
          onChangeText={setText}
          maxLength={240}
          testID="comment-input"
        />
        <TouchableOpacity
          style={[styles.sendBtn, !text.trim() && styles.sendDisabled]}
          disabled={!text.trim()}
          onPress={send}
          testID="send-comment"
        >
          <Send size={16} color={text.trim() ? 'white' : Colors.light.secondary} />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.light.text,
  },
  subtitle: {
    marginTop: 4,
    fontSize: 14,
    color: Colors.light.secondary,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  commentRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  commentAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 12,
  },
  commentContent: {
    flex: 1,
  },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  commentAuthor: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.text,
    marginRight: 8,
  },
  commentTime: {
    fontSize: 12,
    color: Colors.light.secondary,
  },
  commentText: {
    fontSize: 14,
    color: Colors.light.text,
    lineHeight: 20,
    marginBottom: 8,
  },
  likeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
  },
  likeCount: {
    fontSize: 12,
    color: Colors.light.secondary,
    marginLeft: 4,
  },
  likeCountActive: {
    color: Colors.light.tint,
  },
  separator: {
    height: 16,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: 16,
    color: Colors.light.secondary,
    fontWeight: '500',
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: Colors.light.secondary,
    marginTop: 4,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
    backgroundColor: Colors.light.card,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: Colors.light.text,
    fontSize: 16,
    maxHeight: 100,
  },
  sendBtn: {
    marginLeft: 12,
    backgroundColor: Colors.light.tint,
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendDisabled: {
    backgroundColor: Colors.light.border,
  },
  errorText: {
    color: Colors.light.error,
    fontSize: 12,
    marginTop: 4,
  },
});