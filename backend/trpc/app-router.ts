import { createTRPCRouter } from "./create-context";
import { fetchDoualaRestaurantsProcedure } from "./routes/restaurants/douala";
import { fetchYaoundeRestaurantsProcedure } from "./routes/restaurants/yaounde";
import { fetchBueaRestaurantsProcedure } from "./routes/restaurants/buea";
import { fetchLimbeRestaurantsProcedure } from "./routes/restaurants/limbe";
import { searchRestaurantsProcedure } from "./routes/restaurants/search";
import { importFromTripadvisorProcedure, getImportedOneTimeProcedure } from "./routes/restaurants/import";
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
import { 
  toggleUserFollowProcedure, 
  toggleRestaurantFollowProcedure,
  getUserFollowStatsProcedure,
  getFollowersProcedure,
  getFollowingProcedure,
  updateUserProfileProcedure,
  getUserProfileProcedure,
  awardBadgeProcedure
} from "./routes/social/follow";
import { submitClaimProcedure, listClaimsProcedure, adminUpdateClaimProcedure } from "./routes/restaurants/claims";
import { toggleLikeProcedure } from "./routes/posts/like";
import { 
  createPostProcedure as newCreatePostProcedure, 
  updatePostProcedure, 
  deletePostProcedure as userDeletePostProcedure, 
  getUserPostsProcedure 
} from "./routes/posts/create";
import {
  bookmarkPostProcedure,
  getBookmarkedPostsProcedure,
  sharePostProcedure,
  recordPostViewProcedure,
  reportPostProcedure,
  searchPostsProcedure,
  getPostAnalyticsProcedure,
} from "./routes/posts/interactions";
import {
  getPostFeedProcedure,
  getPostDetailsProcedure as userGetPostDetailsProcedure,
  subscribeToPostUpdatesProcedure,
  subscribeToFeedProcedure,
} from "./routes/posts/feed";
import { 
  getAdminStatsProcedure, 
  getAdminNotificationsProcedure, 
  getSystemHealthProcedure, 
  markNotificationReadProcedure 
} from "./routes/admin/dashboard";
import {
  logAdminActivityProcedure,
  getAdminActivitiesProcedure,
  getActivityStatsProcedure,
} from "./routes/admin/activity";
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
import {
  getAdminClaimsProcedure,
  updateAdminClaimProcedure,
  deleteAdminClaimProcedure,
} from "./routes/admin/claims";
import {
  getAdminReportsProcedure,
  updateAdminReportProcedure,
  deleteAdminReportProcedure,
} from "./routes/admin/reports";

export const appRouter = createTRPCRouter({
  example: createTRPCRouter({
    hi: hiRoute,
  }),
  posts: createTRPCRouter({
    list: getPostsProcedure,
    create: createPostProcedure,
    createNew: newCreatePostProcedure,
    update: updatePostProcedure,
    delete: userDeletePostProcedure,
    getUserPosts: getUserPostsProcedure,
    like: toggleLikeProcedure,
    bookmark: bookmarkPostProcedure,
    getBookmarked: getBookmarkedPostsProcedure,
    share: sharePostProcedure,
    recordView: recordPostViewProcedure,
    report: reportPostProcedure,
    search: searchPostsProcedure,
    analytics: getPostAnalyticsProcedure,
    feed: getPostFeedProcedure,
    details: userGetPostDetailsProcedure,
    subscribeToUpdates: subscribeToPostUpdatesProcedure,
    subscribeToFeed: subscribeToFeedProcedure,
  }),
  status: createTRPCRouter({
    create: createStatusProcedure,
  }),
  restaurants: createTRPCRouter({
    list: getRestaurantsProcedure,
    search: searchRestaurantsProcedure,
    douala: fetchDoualaRestaurantsProcedure,
    yaounde: fetchYaoundeRestaurantsProcedure,
    buea: fetchBueaRestaurantsProcedure,
    limbe: fetchLimbeRestaurantsProcedure,
    importFromTripadvisor: importFromTripadvisorProcedure,
    getImportedOneTime: getImportedOneTimeProcedure,
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
    followStats: getUserFollowStatsProcedure,
    followers: getFollowersProcedure,
    following: getFollowingProcedure,
    updateProfile: updateUserProfileProcedure,
    getProfile: getUserProfileProcedure,
    awardBadge: awardBadgeProcedure,
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
      notifications: getAdminNotificationsProcedure,
      systemHealth: getSystemHealthProcedure,
      markNotificationRead: markNotificationReadProcedure,
    }),
    activity: createTRPCRouter({
      log: logAdminActivityProcedure,
      list: getAdminActivitiesProcedure,
      stats: getActivityStatsProcedure,
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
    claims: createTRPCRouter({
      list: getAdminClaimsProcedure,
      update: updateAdminClaimProcedure,
      delete: deleteAdminClaimProcedure,
    }),
    reports: createTRPCRouter({
      list: getAdminReportsProcedure,
      update: updateAdminReportProcedure,
      delete: deleteAdminReportProcedure,
    }),
  }),
});

export type AppRouter = typeof appRouter;