# Push Notifications Implementation

This document outlines the push notification system implemented in the app.

## Overview

The app uses Expo Notifications to handle push notifications. The system:
- Requests permission on first launch after login
- Collects and stores Expo push tokens in the database
- Displays foreground notifications as toast messages
- Handles notification taps for navigation

## Implementation Details

### Database Storage
- Push tokens are stored in the `profiles.push_token` field in Supabase

### Key Components

1. **NotificationProvider** (`providers/NotificationProvider.tsx`)
   - Manages notification permissions
   - Retrieves Expo push tokens
   - Stores tokens in the database via tRPC
   - Sets up notification listeners

2. **ForegroundNotificationHost** (`components/ForegroundNotificationHost.tsx`)
   - Displays toast-style notifications when app is in foreground
   - Handles notification dismissal

3. **tRPC Endpoints**
   - `auth.updatePushToken`: Updates the push token in the user's profile
   - `notifications.registerPushToken`: Alternative endpoint for token registration

### Flow

1. User logs in
2. App checks notification permission status
3. If undetermined, app requests permission
4. If granted, app gets Expo push token
5. Token is saved to database via tRPC
6. App sets up listeners for foreground and background notifications

### Demo Pages

- `/notifications-demo`: Shows notification system status
- `/push-notification-demo`: Allows testing push notifications

## Testing

You can test the notification system by:
1. Logging in
2. Granting notification permission
3. Using the "Send Test Notification" button on the push-notification-demo page

## Files Changed/Used

- `providers/NotificationProvider.tsx`: Main provider for notification functionality
- `components/ForegroundNotificationHost.tsx`: Displays foreground notifications
- `backend/trpc/routes/auth/profile.ts`: Contains updatePushTokenProcedure
- `backend/trpc/routes/notifications/manage.ts`: Contains registerPushTokenProcedure
- `app/notifications-demo.tsx`: Demo page for notification system
- `app/push-notification-demo.tsx`: Demo page for testing push notifications