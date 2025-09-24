import { z } from "zod";
import { protectedProcedure } from "@/backend/trpc/create-context";

const likesByPost = new Map<string, Set<string>>();

export const toggleLikeProcedure = protectedProcedure
  .input(z.object({ postId: z.string() }))
  .mutation(({ input, ctx }) => {
    const me = ctx.user!.id;
    const set = likesByPost.get(input.postId) ?? new Set<string>();
    if (set.has(me)) set.delete(me); else set.add(me);
    likesByPost.set(input.postId, set);
    return { liked: set.has(me), likesCount: set.size };
  });
