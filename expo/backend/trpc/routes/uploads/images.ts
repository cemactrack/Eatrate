import { z } from 'zod';
import { publicProcedure, protectedProcedure } from '@/backend/trpc/create-context';
import { supabaseAdmin } from '@/backend/supabase-admin';
import { TRPCError } from '@trpc/server';

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

const uploadImageSchema = z.object({
  file: z.object({
    base64: z.string(),
    mimeType: z.string(),
    fileName: z.string(),
  }),
  category: z.enum(['avatar', 'restaurant-photo', 'post-media']),
  metadata: z.object({
    restaurantId: z.string().optional(),
    postId: z.string().optional(),
  }).optional(),
});

export const uploadImageProcedure = protectedProcedure
  .input(uploadImageSchema)
  .mutation(async ({ input, ctx }) => {
    if (!supabaseAdmin) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Storage service not configured',
      });
    }

    const { file, category, metadata } = input;
    const userId = ctx.user.id;

    // Validate file type
    if (!ALLOWED_IMAGE_TYPES.includes(file.mimeType)) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Invalid file type. Only JPEG, PNG, and WebP are allowed.',
      });
    }

    // Convert base64 to buffer and check size
    const buffer = Buffer.from(file.base64, 'base64');
    if (buffer.length > MAX_FILE_SIZE) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'File size exceeds 5MB limit.',
      });
    }

    // Generate unique filename
    const timestamp = Date.now();
    const fileExtension = file.fileName.split('.').pop() || 'jpg';
    const uniqueFileName = `${timestamp}-${Math.random().toString(36).substring(2)}.${fileExtension}`;

    // Determine storage path based on category
    let storagePath: string;
    switch (category) {
      case 'avatar':
        storagePath = `avatars/${userId}/${uniqueFileName}`;
        break;
      case 'restaurant-photo':
        storagePath = `restaurant-photos/${userId}/${uniqueFileName}`;
        break;
      case 'post-media':
        storagePath = `post-media/${userId}/${uniqueFileName}`;
        break;
      default:
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Invalid upload category',
        });
    }

    try {
      // Upload to Supabase Storage
      const { error: uploadError } = await supabaseAdmin.storage
        .from('images')
        .upload(storagePath, buffer, {
          contentType: file.mimeType,
          upsert: false,
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to upload image',
        });
      }

      // Get public URL
      const { data: urlData } = supabaseAdmin.storage
        .from('images')
        .getPublicUrl(storagePath);

      const publicUrl = urlData.publicUrl;

      // Log upload for audit trail
      console.log(`[ImageUpload] User ${userId} uploaded ${category}: ${storagePath}`);

      return {
        success: true,
        url: publicUrl,
        path: storagePath,
        fileName: uniqueFileName,
        category,
        metadata: {
          size: buffer.length,
          mimeType: file.mimeType,
          uploadedAt: new Date().toISOString(),
          ...metadata,
        },
      };
    } catch (error) {
      console.error('Image upload error:', error);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to process image upload',
      });
    }
  });

export const deleteImageProcedure = protectedProcedure
  .input(z.object({
    path: z.string(),
  }))
  .mutation(async ({ input, ctx }) => {
    if (!supabaseAdmin) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Storage service not configured',
      });
    }

    const { path } = input;
    const userId = ctx.user.id;

    // Verify user owns this file (path should start with their folder)
    const validPrefixes = [
      `avatars/${userId}/`,
      `restaurant-photos/${userId}/`,
      `post-media/${userId}/`,
    ];

    const isOwner = validPrefixes.some(prefix => {
      if (!prefix || typeof prefix !== 'string') return false;
      return path.startsWith(prefix);
    });
    if (!isOwner) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'You can only delete your own images',
      });
    }

    try {
      const { error } = await supabaseAdmin.storage
        .from('images')
        .remove([path]);

      if (error) {
        console.error('Delete error:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to delete image',
        });
      }

      console.log(`[ImageDelete] User ${userId} deleted: ${path}`);

      return {
        success: true,
        deletedPath: path,
      };
    } catch (error) {
      console.error('Image delete error:', error);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to delete image',
      });
    }
  });

export const getImageUrlProcedure = publicProcedure
  .input(z.object({
    path: z.string(),
  }))
  .query(async ({ input }) => {
    if (!supabaseAdmin) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Storage service not configured',
      });
    }

    const { path } = input;

    try {
      const { data } = supabaseAdmin.storage
        .from('images')
        .getPublicUrl(path);

      return {
        url: data.publicUrl,
        path,
      };
    } catch (error) {
      console.error('Get image URL error:', error);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to get image URL',
      });
    }
  });