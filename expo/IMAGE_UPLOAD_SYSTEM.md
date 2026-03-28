# Image Upload System

This document explains how to use the image upload system with Supabase Storage in your React Native app.

## Overview

The image upload system provides:
- Secure file uploads to Supabase Storage
- Organized storage structure by user and category
- Image validation and optimization
- Easy-to-use React components and hooks
- Cross-platform compatibility (iOS, Android, Web)

## Storage Structure

Images are stored in Supabase Storage with the following structure:
```
images/
├── avatars/{userId}/
│   ├── 1234567890_abc123.jpg
│   └── 1234567891_def456.png
├── restaurant-photos/{userId}/
│   ├── 1234567892_ghi789.jpg
│   └── 1234567893_jkl012.jpg
└── post-media/{userId}/
    ├── 1234567894_mno345.jpg
    └── 1234567895_pqr678.mp4
```

## Backend Setup

### 1. tRPC Routes

The system includes three main tRPC procedures:

- `uploads.uploadImage` - Upload a new image
- `uploads.deleteImage` - Delete an existing image
- `uploads.getImageUrl` - Get public URL for an image

### 2. Supabase Storage Configuration

Make sure your Supabase project has:
1. A storage bucket named `images`
2. Proper RLS policies for user access
3. Public access enabled for the bucket

Example RLS policies:
```sql
-- Allow users to upload to their own folders
CREATE POLICY "Users can upload to own folder" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'images' AND 
  (storage.foldername(name))[1] IN ('avatars', 'restaurant-photos', 'post-media') AND
  (storage.foldername(name))[2] = auth.uid()::text
);

-- Allow users to view all images (for public content)
CREATE POLICY "Anyone can view images" ON storage.objects
FOR SELECT USING (bucket_id = 'images');

-- Allow users to delete their own images
CREATE POLICY "Users can delete own images" ON storage.objects
FOR DELETE USING (
  bucket_id = 'images' AND 
  (storage.foldername(name))[2] = auth.uid()::text
);
```

## Frontend Usage

### 1. Using the ImageUploader Component

```tsx
import { ImageUploader } from '@/components/ImageUploader';

function ProfileScreen() {
  const [avatarUrl, setAvatarUrl] = useState('');

  return (
    <ImageUploader
      category="avatar"
      currentImageUrl={avatarUrl}
      onImageUploaded={(url, path) => {
        setAvatarUrl(url);
        // Save URL to your database
        updateUserProfile({ avatarUrl: url });
      }}
      onImageDeleted={() => {
        setAvatarUrl('');
        updateUserProfile({ avatarUrl: null });
      }}
      placeholder="Upload Profile Picture"
      aspect={[1, 1]}
    />
  );
}
```

### 2. Using the useImageUpload Hook

```tsx
import { useImageUpload } from '@/hooks/useImageUpload';

function CustomUploadComponent() {
  const { pickImage, takePhoto, isUploading, uploadProgress } = useImageUpload();

  const handleUpload = async () => {
    const result = await pickImage({
      category: 'post-media',
      metadata: { postId: 'post-123' },
      quality: 0.8,
      aspect: [16, 9],
    });

    if (result.success) {
      console.log('Uploaded:', result.url);
    } else {
      console.error('Upload failed:', result.error);
    }
  };

  return (
    <TouchableOpacity onPress={handleUpload} disabled={isUploading}>
      <Text>
        {isUploading ? `Uploading... ${uploadProgress}%` : 'Upload Image'}
      </Text>
    </TouchableOpacity>
  );
}
```

### 3. Direct tRPC Usage

```tsx
import { trpc } from '@/lib/trpc';

function DirectUploadExample() {
  const uploadMutation = trpc.uploads.uploadImage.useMutation();

  const handleUpload = async (base64Data: string, mimeType: string) => {
    try {
      const result = await uploadMutation.mutateAsync({
        file: {
          base64: base64Data,
          mimeType,
          fileName: 'image.jpg',
        },
        category: 'restaurant-photo',
        metadata: { restaurantId: 'rest-456' },
      });

      console.log('Upload successful:', result.url);
    } catch (error) {
      console.error('Upload failed:', error);
    }
  };
}
```

## Image Categories

### Avatar
- **Purpose**: User profile pictures
- **Recommended aspect ratio**: 1:1 (square)
- **Storage path**: `avatars/{userId}/`
- **Use case**: User profiles, comments, social features

### Restaurant Photo
- **Purpose**: Restaurant images, food photos
- **Recommended aspect ratio**: 4:3 or 16:9
- **Storage path**: `restaurant-photos/{userId}/`
- **Use case**: Restaurant listings, menu items, reviews
- **Metadata**: `{ restaurantId: string }`

### Post Media
- **Purpose**: Social media posts, user-generated content
- **Recommended aspect ratio**: 16:9 or 1:1
- **Storage path**: `post-media/{userId}/`
- **Use case**: Social posts, reviews, stories
- **Metadata**: `{ postId: string }`

## Configuration Options

### ImageUploader Props

```tsx
interface ImageUploaderProps {
  category: 'avatar' | 'restaurant-photo' | 'post-media';
  currentImageUrl?: string;
  onImageUploaded?: (url: string, path: string) => void;
  onImageDeleted?: () => void;
  metadata?: { restaurantId?: string; postId?: string };
  style?: ViewStyle;
  imageStyle?: ImageStyle;
  placeholder?: string;
  showDeleteButton?: boolean;
  disabled?: boolean;
  quality?: number; // 0-1, default 0.8
  allowsEditing?: boolean; // default true
  aspect?: [number, number]; // default [1, 1]
}
```

### Upload Options

```tsx
interface ImageUploadOptions {
  category: 'avatar' | 'restaurant-photo' | 'post-media';
  metadata?: { restaurantId?: string; postId?: string };
  quality?: number; // 0-1, compression quality
  allowsEditing?: boolean; // show crop/edit UI
  aspect?: [number, number]; // aspect ratio constraint
}
```

## File Validation

The system automatically validates:
- **File types**: JPEG, PNG, WebP only
- **File size**: 5MB maximum (configurable)
- **User permissions**: Users can only upload to their own folders

## Error Handling

Common errors and solutions:

### Upload Errors
- **"Storage service not configured"**: Check Supabase admin client setup
- **"Invalid file type"**: Only JPEG, PNG, WebP are allowed
- **"File size exceeds limit"**: Compress image or reduce quality
- **"Failed to upload image"**: Check network connection and Supabase config

### Permission Errors
- **"You can only delete your own images"**: User trying to delete another user's image
- **"Invalid token"**: User not authenticated properly

### Web Compatibility
- Camera access may be limited on web browsers
- File picker works on all platforms
- Image optimization is handled differently on web vs mobile

## Best Practices

1. **Always validate uploads**: Check file size and type before uploading
2. **Handle errors gracefully**: Show user-friendly error messages
3. **Optimize images**: Use appropriate quality settings for your use case
4. **Clean up unused images**: Implement cleanup for deleted posts/users
5. **Monitor storage usage**: Track storage costs and usage patterns
6. **Use appropriate aspect ratios**: Match your UI design requirements
7. **Implement loading states**: Show progress during uploads
8. **Cache image URLs**: Store URLs in your database for quick access

## Security Considerations

1. **User isolation**: Each user can only access their own upload folders
2. **File validation**: Server-side validation prevents malicious uploads
3. **Size limits**: Prevent abuse with reasonable file size limits
4. **Rate limiting**: Consider implementing upload rate limits
5. **Content moderation**: Implement image content scanning if needed

## Performance Tips

1. **Image compression**: Use quality settings between 0.7-0.9 for good balance
2. **Lazy loading**: Load images only when needed
3. **Thumbnail generation**: Create smaller versions for lists/previews
4. **CDN usage**: Supabase Storage includes CDN for fast delivery
5. **Caching**: Implement proper image caching strategies

## Troubleshooting

### Common Issues

1. **Images not appearing**: Check public URL generation and bucket policies
2. **Upload timeouts**: Reduce image size or check network connection
3. **Permission denied**: Verify RLS policies and user authentication
4. **CORS errors**: Ensure proper CORS configuration in Supabase

### Debug Steps

1. Check browser/app console for error messages
2. Verify Supabase Storage bucket configuration
3. Test with smaller image files
4. Check network connectivity
5. Verify user authentication status

## Example Implementation

See `app/image-upload-example.tsx` for a complete working example with all three image categories.