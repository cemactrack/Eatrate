import { publicProcedure } from "../../../create-context";
import { z } from "zod";

// Example procedure that uses Supabase
export const supabaseTestProcedure = publicProcedure
  .input(
    z.object({
      table: z.string().optional().default("users"),
    })
  )
  .query(async ({ ctx, input }) => {
    try {
      // Check if Supabase client is available
      if (!ctx.supabase) {
        return {
          success: false,
          message: "Supabase client not initialized",
          data: null,
        };
      }

      // Get the table name from input or use default
      const { table } = input;

      // Perform a simple query to test the connection
      // This just checks if the table exists and returns some basic info
      const { data, error } = await ctx.supabase
        .from(table)
        .select("count")
        .limit(1)
        .throwOnError();

      if (error) {
        return {
          success: false,
          message: `Error querying Supabase: ${error.message}`,
          error,
          data: null,
        };
      }

      return {
        success: true,
        message: "Successfully connected to Supabase",
        data,
        connectionInfo: {
          url: process.env.SUPABASE_URL || process.env.EXPO_PUBLIC_SUPABASE_URL,
          usingServiceKey: !!ctx.supabaseAdmin,
        },
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return {
        success: false,
        message: `Unexpected error: ${errorMessage}`,
        error,
        data: null,
      };
    }
  });