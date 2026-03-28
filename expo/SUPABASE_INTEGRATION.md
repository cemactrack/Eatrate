# Supabase Integration Guide

This document outlines how Supabase is integrated into the EatRate application.

## Configuration

### Environment Variables

The application uses the following environment variables for Supabase:

#### Client-side (public) variables:
- `EXPO_PUBLIC_SUPABASE_URL`: The URL of your Supabase project
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`: The anonymous key for client-side operations

#### Server-side (private) variables:
- `SUPABASE_URL`: The URL of your Supabase project (same as client-side)
- `SUPABASE_ANON_KEY`: The anonymous key (same as client-side)
- `SUPABASE_SERVICE_KEY`: The service key for privileged server-side operations

### Important Security Note

The service key (`SUPABASE_SERVICE_KEY`) provides full access to your database and should **never** be exposed to the client. It is only used in server-side code.

## Integration Points

### Server-side Integration

The server-side integration is implemented in `backend/trpc/create-context.ts`. This file:

1. Initializes a Supabase admin client using the service key
2. Falls back to the anon key if the service key is not available
3. Adds the Supabase client to the tRPC context, making it available to all procedures

### Client-side Integration

The client-side integration is implemented in `lib/supabase.ts`. This file:

1. Creates a Supabase client using the public anon key
2. Provides helper functions for common operations
3. Handles error cases when Supabase is not properly configured

## Usage Examples

### Server-side (tRPC Procedures)

```typescript
// Example tRPC procedure using Supabase
export const getUserProfileProcedure = protectedProcedure
  .input(z.object({ userId: z.string() }))
  .query(async ({ ctx, input }) => {
    // Access Supabase from the context
    const { supabase } = ctx;
    
    if (!supabase) {
      throw new TRPCError({ 
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Database connection not available'
      });
    }
    
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', input.userId)
      .single();
      
    if (error) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: error.message
      });
    }
    
    return data;
  });
```

### Client-side

```typescript
import { supabase } from '@/lib/supabase';

// Example function using Supabase client-side
async function updateUserAvatar(userId: string, avatarUrl: string) {
  if (!supabase) {
    console.error('Supabase not configured');
    return null;
  }
  
  const { data, error } = await supabase
    .from('profiles')
    .update({ avatar_url: avatarUrl })
    .eq('id', userId);
    
  if (error) {
    console.error('Error updating avatar:', error.message);
    return null;
  }
  
  return data;
}
```

## Testing the Integration

You can test the Supabase integration by:

1. Navigating to `/supabase-test` in the app
2. Selecting a table to test
3. Clicking "Test Connection"

This will attempt to connect to Supabase and perform a simple query on the selected table.

## Troubleshooting

If you encounter issues with the Supabase integration:

1. Check that all environment variables are properly set
2. Ensure the service key has the necessary permissions
3. Verify that the tables you're trying to access exist in your Supabase project
4. Check network connectivity to the Supabase API

For more information, refer to the [Supabase documentation](https://supabase.com/docs).