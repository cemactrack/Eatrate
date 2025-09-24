import { z } from "zod";
import { protectedProcedure, publicProcedure } from "@/backend/trpc/create-context";

type ClaimStatus = 'pending' | 'approved' | 'rejected';

interface ClaimItem {
  id: string;
  restaurantId: string;
  submittedBy: string;
  type: 'claim' | 'list';
  details: string;
  createdAt: string;
  status: ClaimStatus;
  adminNote?: string;
}

const claims: ClaimItem[] = [];

export const submitClaimProcedure = protectedProcedure
  .input(z.object({
    restaurantId: z.string().optional(),
    type: z.enum(['claim', 'list']),
    details: z.string().min(10).max(1000),
  }))
  .mutation(({ input, ctx }) => {
    const id = String(Date.now());
    const item: ClaimItem = {
      id,
      restaurantId: input.restaurantId ?? `new_${id}`,
      submittedBy: ctx.user!.id,
      type: input.type,
      details: input.details,
      createdAt: new Date().toISOString(),
      status: 'pending',
    };
    claims.unshift(item);
    return { id: item.id, status: item.status };
  });

export const listClaimsProcedure = publicProcedure
  .input(z.object({ status: z.enum(['pending', 'approved', 'rejected']).optional() }).optional())
  .query(({ input }) => {
    const filter = input?.status;
    const items = filter ? claims.filter(c => c.status === filter) : claims;
    return { claims: items };
  });

export const adminUpdateClaimProcedure = protectedProcedure
  .input(z.object({ id: z.string(), status: z.enum(['pending', 'approved', 'rejected']), adminNote: z.string().optional() }))
  .mutation(({ input }) => {
    const idx = claims.findIndex(c => c.id === input.id);
    if (idx === -1) return { updated: false };
    claims[idx] = { ...claims[idx], status: input.status, adminNote: input.adminNote };
    return { updated: true };
  });
