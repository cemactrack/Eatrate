import { z } from "zod";
import { protectedProcedure } from "@/backend/trpc/create-context";

const userFollowState = new Map<string, Set<string>>();
const restaurantFollowState = new Map<string, Set<string>>();

export const toggleUserFollowProcedure = protectedProcedure
  .input(z.object({ targetUserId: z.string() }))
  .mutation(({ input, ctx }) => {
    const me = ctx.user!.id;
    if (me === input.targetUserId) {
      return { following: false, followersCount: (userFollowState.get(input.targetUserId)?.size ?? 0) };
    }
    const set = userFollowState.get(input.targetUserId) ?? new Set<string>();
    if (set.has(me)) set.delete(me); else set.add(me);
    userFollowState.set(input.targetUserId, set);
    return { following: set.has(me), followersCount: set.size };
  });

export const toggleRestaurantFollowProcedure = protectedProcedure
  .input(z.object({ restaurantId: z.string() }))
  .mutation(({ input, ctx }) => {
    const me = ctx.user!.id;
    const set = restaurantFollowState.get(input.restaurantId) ?? new Set<string>();
    if (set.has(me)) set.delete(me); else set.add(me);
    restaurantFollowState.set(input.restaurantId, set);
    return { following: set.has(me), followersCount: set.size };
  });
