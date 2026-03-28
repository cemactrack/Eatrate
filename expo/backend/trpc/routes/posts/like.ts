import { z } from "zod";
import { protectedProcedure } from "@/backend/trpc/create-context";
import { supabaseAdmin } from "@/backend/supabase-admin";
import { emitPostUpdate } from "./feed";

export const toggleLikeProcedure = protectedProcedure
  .input(z.object({ postId: z.string() }))
  .mutation(async ({ input, ctx }) => {
    const me = ctx.user!.id;
    
    if (!supabaseAdmin) {
      throw new Error('Supabase admin client not configured');
    }

    try {
      // Check if already liked
      const { data: existingLike } = await supabaseAdmin
        .from('likes')
        .select('id')
        .eq('user_id', me)
        .eq('post_id', input.postId)
        .single();

      let liked: boolean;
      if (existingLike) {
        // Unlike
        await supabaseAdmin
          .from('likes')
          .delete()
          .eq('user_id', me)
          .eq('post_id', input.postId);
        liked = false;
      } else {
        // Like
        await supabaseAdmin
          .from('likes')
          .insert({
            user_id: me,
            post_id: input.postId,
          });
        liked = true;
      }

      // Get updated likes count
      const { count: likesCount } = await supabaseAdmin
        .from('likes')
        .select('*', { count: 'exact', head: true })
        .eq('post_id', input.postId);

      // Update post likes count
      await supabaseAdmin
        .from('posts')
        .update({ likes_count: likesCount || 0 })
        .eq('id', input.postId);

      const result = { liked, likesCount: likesCount || 0 };
      
      // Emit real-time update
      emitPostUpdate(input.postId, {
        likesCount: result.likesCount,
        isLiked: result.liked
      });
      
      return result;
    } catch (error) {
      console.error('[tRPC] toggleLike error', error);
      throw new Error('Failed to toggle like');
    }
  });
