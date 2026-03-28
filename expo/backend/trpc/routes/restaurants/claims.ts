import { z } from "zod";
import { protectedProcedure, publicProcedure } from "@/backend/trpc/create-context";
import { supabaseAdmin } from "@/backend/supabase-admin";

export const submitClaimProcedure = protectedProcedure
  .input(z.object({
    restaurantId: z.string().optional(),
    type: z.enum(['claim', 'list']),
    details: z.string().min(10).max(1000),
  }))
  .mutation(async ({ input, ctx }) => {
    if (!supabaseAdmin) {
      throw new Error('Supabase admin client not configured');
    }

    try {
      const { data: claim, error } = await supabaseAdmin
        .from('claims')
        .insert({
          restaurant_id: input.restaurantId || null,
          submitted_by: ctx.user!.id,
          type: input.type,
          details: input.details,
          status: 'pending',
        })
        .select('id, status')
        .single();

      if (error) {
        console.error('[tRPC] submit claim error', error);
        throw new Error('Failed to submit claim');
      }

      return { id: claim.id, status: claim.status };
    } catch (error) {
      console.error('[tRPC] submitClaim error', error);
      throw new Error('Failed to submit claim');
    }
  });

export const listClaimsProcedure = publicProcedure
  .input(z.object({ status: z.enum(['pending', 'approved', 'rejected']).optional() }).optional())
  .query(async ({ input }) => {
    if (!supabaseAdmin) {
      throw new Error('Supabase admin client not configured');
    }

    try {
      let query = supabaseAdmin
        .from('claims')
        .select(`
          *,
          profiles!claims_submitted_by_fkey (
            id,
            display_name,
            avatar_url
          ),
          restaurants (
            id,
            name,
            address
          )
        `)
        .order('created_at', { ascending: false });

      if (input?.status) {
        query = query.eq('status', input.status);
      }

      const { data: claims, error } = await query;

      if (error) {
        console.error('[tRPC] list claims error', error);
        return { claims: [] };
      }

      const mapped = (claims || []).map((c) => ({
        id: c.id,
        restaurantId: c.restaurant_id,
        submittedBy: c.submitted_by,
        type: c.type,
        details: c.details,
        createdAt: c.created_at,
        status: c.status,
        adminNote: c.admin_note,
        user: c.profiles ? {
          id: c.profiles.id,
          displayName: c.profiles.display_name,
          avatar: c.profiles.avatar_url,
        } : null,
        restaurant: c.restaurants ? {
          id: c.restaurants.id,
          name: c.restaurants.name,
          address: c.restaurants.address,
        } : null,
      }));

      return { claims: mapped };
    } catch (error) {
      console.error('[tRPC] listClaims error', error);
      return { claims: [] };
    }
  });

export const adminUpdateClaimProcedure = protectedProcedure
  .input(z.object({ id: z.string(), status: z.enum(['pending', 'approved', 'rejected']), adminNote: z.string().optional() }))
  .mutation(async ({ input }) => {
    if (!supabaseAdmin) {
      throw new Error('Supabase admin client not configured');
    }

    try {
      const { error } = await supabaseAdmin
        .from('claims')
        .update({
          status: input.status,
          admin_note: input.adminNote || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', input.id);

      if (error) {
        console.error('[tRPC] admin update claim error', error);
        throw new Error('Failed to update claim');
      }

      return { updated: true };
    } catch (error) {
      console.error('[tRPC] adminUpdateClaim error', error);
      throw new Error('Failed to update claim');
    }
  });
