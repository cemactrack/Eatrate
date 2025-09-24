import { z } from "zod";
import { protectedProcedure } from "@/backend/trpc/create-context";
import { emitPostUpdate } from "./feed";

const likesByPost = new Map<string, Set<string>>();

export const toggleLikeProcedure = protectedProcedure
  .input(z.object({ postId: z.string() }))
  .mutation(({ input, ctx }) => {
    const me = ctx.user!.id;
    const set = likesByPost.get(input.postId) ?? new Set<string>();
    const wasLiked = set.has(me);
    if (wasLiked) {
      set.delete(me);
    } else {
      set.add(me);
    }
    likesByPost.set(input.postId, set);
    
    const result = { liked: !wasLiked, likesCount: set.size };
    
    // Emit real-time update
    emitPostUpdate(input.postId, {
      likesCount: result.likesCount,
      isLiked: result.liked
    });
    
    return result;
  });
