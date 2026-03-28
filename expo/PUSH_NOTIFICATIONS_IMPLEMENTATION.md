# Push Notifications Implementation

## Overview
Implemented Expo push token collection and storage system with automatic permission requests after login and foreground notification handling.

## Files Changed

### 1. `providers/NotificationProvider.tsx` (NEW)
- **Purpose**: Manages push notification permissions and token collection
- **Features**:
  - Automatic permission request after user login
  - Expo push token generation and storage
  - tRPC integration to save tokens to database
  - Foreground notification listeners
  - Web compatibility (graceful degradation)
  - Platform-specific alert handling

### 2. `backend/trpc/routes/auth/profile.ts` (EXISTING)
- **Database Field**: `profiles.push_token` (string)
- **Procedure**: `updatePushTokenProcedure`
- **Purpose**: Stores Expo push tokens in the database linked to user profiles

### 3. `components/ForegroundNotificationHost.tsx` (EXISTING)
- **Purpose**: Displays toast notifications when app is in foreground
- **Features**:
  - Animated toast notifications
  - Auto-dismiss after 5 seconds
  - Manual dismiss with close button
  - Safe area aware positioning

### 4. `providers/AppProviders.tsx` (EXISTING)
- **Integration**: NotificationProvider is already integrated in the provider chain
- **Position**: Nested within AuthProvider to access user context

### 5. `app/notifications-demo.tsx` (NEW)
- **Purpose**: Demo screen showing notification status and permissions
- **Features**:
  - Shows authentication status
  - Displays permission status with icons
  - Shows push token (truncated)
  - Manual permission request button
  - Web compatibility notices

### 6. `app/push-notification-demo.tsx` (NEW)
- **Purpose**: Interactive demo for sending test notifications
- **Features**:
  - Send test notifications to yourself
  - Customizable title and body
  - Direct integration with Expo push service
  - Status validation and error handling

## Database Schema

### Profiles Table
```sql
ALTER TABLE profiles ADD COLUMN push_token TEXT;
```

The `push_token` field in the `profiles` table stores the Expo push token for each user.

## How It Works

### 1. Automatic Flow
1. User logs in via AuthProvider
2. NotificationProvider detects user login
3. After 1-second delay, automatically requests notification permission
4. If granted, generates Expo push token
5. Saves token to database via tRPC `auth.updatePushToken` mutation
6. Token is now available for sending push notifications

### 2. Permission States
- **granted**: Notifications enabled, token available
- **denied**: User denied permission, no token
- **undetermined**: Permission not yet requested
- **web**: Not supported on web platform

### 3. Foreground Handling
- When app is in foreground, notifications show as toast messages
- ForegroundNotificationHost component handles the display
- Notifications auto-dismiss after 5 seconds
- Users can manually dismiss with close button

### 4. Background Handling
- Background notifications appear in system notification tray
- Tapping notifications can trigger navigation (data.screen)
- Standard Expo notification behavior

## Environment Variables Required

```env
EXPO_PUBLIC_PROJECT_ID=your_expo_project_id
```

This is required for `Notifications.getExpoPushTokenAsync()`.

## Usage Examples

### Using the NotificationProvider
```tsx
import { useNotifications } from '@/providers/NotificationProvider';

function MyComponent() {
  const { expoPushToken, permissionStatus, requestPermission, loading } = useNotifications();
  
  // Check if notifications are available
  const canSendNotifications = expoPushToken && permissionStatus === 'granted';
  
  return (
    <View>
      <Text>Status: {permissionStatus}</Text>
      <Text>Token: {expoPushToken ? 'Available' : 'Not available'}</Text>
      {!canSendNotifications && (
        <Button onPress={requestPermission} title="Enable Notifications" />
      )}
    </View>
  );
}
```

### Sending Push Notifications (Server-side)
```javascript
// Example server-side code to send notifications
const sendPushNotification = async (pushToken, title, body, data = {}) => {
  const message = {
    to: pushToken,
    sound: 'default',
    title,
    body,
    data,
  };

  const response = await fetch('https://exp.host/--/api/v2/push/send', {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Accept-encoding': 'gzip, deflate',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(message),
  });

  return response.json();
};
```

## Testing

### Demo Pages
1. **`/notifications-demo`**: View notification status and permissions
2. **`/push-notification-demo`**: Send test notifications to yourself

### Testing Steps
1. Log in to the app
2. Grant notification permissions when prompted
3. Navigate to `/push-notification-demo`
4. Enter custom title and body
5. Tap "Send Test Notification"
6. Verify notification is received

### Platform Testing
- **Mobile**: Full functionality including background notifications
- **Web**: Graceful degradation with appropriate messaging
- **Simulator**: Works with Expo Go app

## Web Compatibility

The implementation includes proper web compatibility:
- Platform checks prevent web-specific errors
- Graceful degradation with informative messages
- No crashes or console errors on web
- Alert APIs are conditionally used (mobile only)

## Error Handling

- Permission denied: Shows user-friendly message
- Token generation failure: Logs error and shows alert
- Database save failure: Logs error via tRPC
- Network errors: Proper error boundaries and user feedback
- Web platform: Appropriate "not supported" messaging

## Security Considerations

- Push tokens are stored securely in the database
- Only authenticated users can update their push tokens
- tRPC procedures include proper authentication checks
- No sensitive data exposed in push notification payloads

## Performance

- Automatic permission request has 1-second delay to avoid UI conflicts
- Tokens are cached in memory to avoid repeated API calls
- Database updates are debounced through tRPC mutations
- Foreground notifications use efficient React Native Animated API

## Future Enhancements

1. **Notification Categories**: Support for different notification types
2. **Rich Notifications**: Images, actions, and interactive elements
3. **Scheduling**: Local notification scheduling
4. **Analytics**: Track notification delivery and engagement
5. **Preferences**: User-configurable notification settings
6. **Batching**: Batch notification sending for multiple users