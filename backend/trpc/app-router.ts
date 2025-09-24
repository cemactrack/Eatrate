import { createTRPCRouter } from "./create-context";
import { fetchDoualaRestaurantsProcedure } from "./routes/restaurants/douala";
import { fetchYaoundeRestaurantsProcedure } from "./routes/restaurants/yaounde";
import { fetchBueaRestaurantsProcedure } from "./routes/restaurants/buea";
import { fetchLimbeRestaurantsProcedure } from "./routes/restaurants/limbe";
import hiRoute, {
  getPostsProcedure,
  createPostProcedure,
  getRestaurantsProcedure,
  getCommentsProcedure,
  createCommentProcedure,
  getDishesProcedure,
  getUsersProcedure,
  createStatusProcedure,
} from "./routes/example/hi/route";
import { listSuppliersProcedure } from "./routes/suppliers/list";
import { toggleUserFollowProcedure, toggleRestaurantFollowProcedure } from "./routes/social/follow";
import { submitClaimProcedure, listClaimsProcedure, adminUpdateClaimProcedure } from "./routes/restaurants/claims";
import { toggleLikeProcedure } from "./routes/posts/like";
import { 
  getAdminStatsProcedure, 
  getAdminActivitiesProcedure, 
  getAdminNotificationsProcedure, 
  getSystemHealthProcedure, 
  markNotificationReadProcedure 
} from "./routes/admin/dashboard";
import { 
  getAllUsersProcedure, 
  getUserDetailsProcedure, 
  updateUserStatusProcedure, 
  deleteUserProcedure, 
  getUserActivityProcedure 
} from "./routes/admin/users";
import { 
  getFlaggedContentProcedure, 
  getReportsProcedure, 
  updateReportStatusProcedure, 
  moderateContentProcedure, 
  bulkModerateProcedure 
} from "./routes/admin/moderation";
import { 
  getAdminSettingsProcedure, 
  updateAdminSettingsProcedure, 
  getAnalyticsProcedure, 
  exportDataProcedure 
} from "./routes/admin/settings";
import {
  getAdminRestaurantsProcedure,
  updateRestaurantStatusProcedure,
  deleteRestaurantProcedure,
  getRestaurantDetailsProcedure,
} from "./routes/admin/restaurants";
import {
  getAdminPostsProcedure,
  deletePostProcedure,
  getPostDetailsProcedure,
} from "./routes/admin/posts";
import {
  getAdminSuppliersProcedure,
  updateSupplierStatusProcedure,
  deleteSupplierProcedure,
} from "./routes/admin/suppliers";

export const appRouter = createTRPCRouter({
  example: createTRPCRouter({
    hi: hiRoute,
  }),
  posts: createTRPCRouter({
    list: getPostsProcedure,
    create: createPostProcedure,
    like: toggleLikeProcedure,
  }),
  status: createTRPCRouter({
    create: createStatusProcedure,
  }),
  restaurants: createTRPCRouter({
    list: getRestaurantsProcedure,
    douala: fetchDoualaRestaurantsProcedure,
    yaounde: fetchYaoundeRestaurantsProcedure,
    buea: fetchBueaRestaurantsProcedure,
    limbe: fetchLimbeRestaurantsProcedure,
    claims: createTRPCRouter({
      submit: submitClaimProcedure,
      list: listClaimsProcedure,
      adminUpdate: adminUpdateClaimProcedure,
    }),
    follow: toggleRestaurantFollowProcedure,
  }),
  dishes: createTRPCRouter({
    list: getDishesProcedure,
  }),
  users: createTRPCRouter({
    list: getUsersProcedure,
    follow: toggleUserFollowProcedure,
  }),
  suppliers: createTRPCRouter({
    list: listSuppliersProcedure,
  }),
  comments: createTRPCRouter({
    list: getCommentsProcedure,
    create: createCommentProcedure,
  }),
  admin: createTRPCRouter({
    dashboard: createTRPCRouter({
      stats: getAdminStatsProcedure,
      activities: getAdminActivitiesProcedure,
      notifications: getAdminNotificationsProcedure,
      systemHealth: getSystemHealthProcedure,
      markNotificationRead: markNotificationReadProcedure,
    }),
    users: createTRPCRouter({
      list: getAllUsersProcedure,
      details: getUserDetailsProcedure,
      updateStatus: updateUserStatusProcedure,
      delete: deleteUserProcedure,
      activity: getUserActivityProcedure,
    }),
    moderation: createTRPCRouter({
      flaggedContent: getFlaggedContentProcedure,
      reports: getReportsProcedure,
      updateReport: updateReportStatusProcedure,
      moderateContent: moderateContentProcedure,
      bulkModerate: bulkModerateProcedure,
    }),
    settings: createTRPCRouter({
      get: getAdminSettingsProcedure,
      update: updateAdminSettingsProcedure,
      analytics: getAnalyticsProcedure,
      export: exportDataProcedure,
    }),
    restaurants: createTRPCRouter({
      list: getAdminRestaurantsProcedure,
      updateStatus: updateRestaurantStatusProcedure,
      delete: deleteRestaurantProcedure,
      details: getRestaurantDetailsProcedure,
    }),
    posts: createTRPCRouter({
      list: getAdminPostsProcedure,
      delete: deletePostProcedure,
      details: getPostDetailsProcedure,
    }),
    suppliers: createTRPCRouter({
      list: getAdminSuppliersProcedure,
      updateStatus: updateSupplierStatusProcedure,
      delete: deleteSupplierProcedure,
    }),
  }),
});

export type AppRouter = typeof appRouter;