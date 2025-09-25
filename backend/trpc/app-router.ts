import { createTRPCRouter, publicProcedure } from "./create-context";
import { fetchDoualaRestaurantsProcedure } from "./routes/restaurants/douala";
import { fetchYaoundeRestaurantsProcedure } from "./routes/restaurants/yaounde";
import { fetchBueaRestaurantsProcedure } from "./routes/restaurants/buea";
import { fetchLimbeRestaurantsProcedure } from "./routes/restaurants/limbe";
import { searchRestaurantsProcedure } from "./routes/restaurants/search";
import { searchByPhotoProcedure } from "./routes/restaurants/photo-search";
import { importFromTripadvisorProcedure, getImportedOneTimeProcedure, needsInitialImportProcedure, bootstrapImportProcedure } from "./routes/restaurants/import";
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

// New feature routes
import { getStatsProcedure, checkAchievementsProcedure, claimRewardProcedure, joinChallengeProcedure, updateProgressProcedure } from "./routes/gamification/stats";
import { getAllProcedure, getSettingsProcedure, markAsReadProcedure, markAllAsReadProcedure, deleteProcedure, updateSettingsProcedure, registerPushTokenProcedure } from "./routes/notifications/manage";
import { getEventsProcedure, attendEventProcedure, getPollsProcedure, votePollProcedure, getChallengesProcedure, joinChallengeProcedure as joinEventChallengeProcedure } from "./routes/events/manage";
import { estimateCaloriesProcedure } from "./routes/nutrition/analyze";

// Reservation routes
import {
  getReservationsProcedure,
  getAvailabilityProcedure,
  createReservationProcedure,
  updateReservationProcedure,
  getReservationDetailsProcedure,
} from "./routes/reservations/manage";

// QR code routes
import {
  getQRMenuProcedure,
  generateQRMenuProcedure,
  trackQRScanProcedure,
  getQRAnalyticsProcedure,
  updateQRMenuStatusProcedure,
} from "./routes/qr/manage";

// Menu management routes
import {
  getRestaurantMenuProcedure,
  createMenuCategoryProcedure,
  addDishToMenuProcedure,
} from "./routes/menu/manage";

// Support routes
import {
  getFAQsProcedure,
  createSupportTicketProcedure,
  getUserTicketsProcedure,
  addTicketResponseProcedure,
  chatWithSupportProcedure,
  getSupportCategoriesProcedure,
} from "./routes/support/manage";

// Subscription & Monetization routes
import {
  getUserSubscriptionProcedure,
  getSubscriptionPlansProcedure,
  subscribeToPlanProcedure,
  cancelSubscriptionProcedure,
  getSponsoredListingsProcedure,
  getUserRewardsProcedure,
  redeemRewardProcedure,
  getDeliveryPartnersProcedure,
} from "./routes/subscriptions/manage";

// Groups & Community routes
import {
  getGroupsProcedure,
  getGroupDetailsProcedure,
  joinGroupProcedure,
  leaveGroupProcedure,
  createGroupProcedure,
  getGroupPostsProcedure,
  createGroupPostProcedure,
  getUserGroupsProcedure,
} from "./routes/groups/manage";

// Discovery & Trending routes
import {
  getTrendingDishesProcedure,
  getNearbyRecommendationsProcedure,
  getPersonalizedRecommendationsProcedure,
  dismissRecommendationProcedure,
  getSearchHistoryProcedure,
  saveSearchQueryProcedure,
  clearSearchHistoryProcedure,
  getSmartSuggestionsProcedure,
  getDishOfTheDayProcedure,
} from "./routes/discovery/trending";

// Reputation routes
import {
  getUserReputationProcedure,
  getReputationLeaderboardProcedure,
  awardPointsProcedure,
  getAvailableBadgesProcedure,
  updateTrustScoreProcedure,
  getUserAchievementsSummaryProcedure,
} from "./routes/reputation/manage";

// Messaging routes
import {
  getConversations,
  getMessages,
  sendMessage,
  startConversation,
  markAsRead,
  deleteMessage,
  archiveConversation,
  blockUser,
  getBlockedUsers,
  reportMessage,
  addReaction,
  removeReaction,
  getMessageReactions,
  setTyping,
  getTypingIndicators,
  searchConversations,
  getUnreadCount,
} from "./routes/messaging/manage";

export const appRouter = createTRPCRouter({
  // Health check endpoint
  health: publicProcedure.query(() => {
    return { status: 'ok', message: 'tRPC server is running', timestamp: new Date().toISOString() };
  }),
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
    searchByPhoto: searchByPhotoProcedure,
    douala: fetchDoualaRestaurantsProcedure,
    yaounde: fetchYaoundeRestaurantsProcedure,
    buea: fetchBueaRestaurantsProcedure,
    limbe: fetchLimbeRestaurantsProcedure,
    importFromTripadvisor: importFromTripadvisorProcedure,
    getImportedOneTime: getImportedOneTimeProcedure,
    needsInitialImport: needsInitialImportProcedure,
    bootstrapImport: bootstrapImportProcedure,
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
  // New feature routes
  gamification: createTRPCRouter({
    getStats: getStatsProcedure,
    checkAchievements: checkAchievementsProcedure,
    claimReward: claimRewardProcedure,
    joinChallenge: joinChallengeProcedure,
    updateProgress: updateProgressProcedure,
  }),
  notifications: createTRPCRouter({
    getAll: getAllProcedure,
    getSettings: getSettingsProcedure,
    markAsRead: markAsReadProcedure,
    markAllAsRead: markAllAsReadProcedure,
    delete: deleteProcedure,
    updateSettings: updateSettingsProcedure,
    registerPushToken: registerPushTokenProcedure,
  }),
  events: createTRPCRouter({
    getEvents: getEventsProcedure,
    attendEvent: attendEventProcedure,
    getPolls: getPollsProcedure,
    votePoll: votePollProcedure,
    getChallenges: getChallengesProcedure,
    joinChallenge: joinEventChallengeProcedure,
  }),
  nutrition: createTRPCRouter({
    estimateCalories: estimateCaloriesProcedure,
  }),
  reservations: createTRPCRouter({
    list: getReservationsProcedure,
    availability: getAvailabilityProcedure,
    create: createReservationProcedure,
    update: updateReservationProcedure,
    details: getReservationDetailsProcedure,
  }),
  qr: createTRPCRouter({
    getMenu: getQRMenuProcedure,
    generate: generateQRMenuProcedure,
    trackScan: trackQRScanProcedure,
    analytics: getQRAnalyticsProcedure,
    updateStatus: updateQRMenuStatusProcedure,
  }),
  menu: createTRPCRouter({
    get: getRestaurantMenuProcedure,
    createCategory: createMenuCategoryProcedure,
    addDish: addDishToMenuProcedure,
  }),
  support: createTRPCRouter({
    getFAQs: getFAQsProcedure,
    createTicket: createSupportTicketProcedure,
    getUserTickets: getUserTicketsProcedure,
    addTicketResponse: addTicketResponseProcedure,
    chat: chatWithSupportProcedure,
    getCategories: getSupportCategoriesProcedure,
  }),
  // New feature routes
  subscriptions: createTRPCRouter({
    getUserSubscription: getUserSubscriptionProcedure,
    getPlans: getSubscriptionPlansProcedure,
    subscribe: subscribeToPlanProcedure,
    cancel: cancelSubscriptionProcedure,
    getSponsoredListings: getSponsoredListingsProcedure,
    getUserRewards: getUserRewardsProcedure,
    redeemReward: redeemRewardProcedure,
    getDeliveryPartners: getDeliveryPartnersProcedure,
  }),
  groups: createTRPCRouter({
    getAll: getGroupsProcedure,
    getDetails: getGroupDetailsProcedure,
    join: joinGroupProcedure,
    leave: leaveGroupProcedure,
    create: createGroupProcedure,
    getPosts: getGroupPostsProcedure,
    createPost: createGroupPostProcedure,
    getUserGroups: getUserGroupsProcedure,
  }),
  discovery: createTRPCRouter({
    getTrendingDishes: getTrendingDishesProcedure,
    getNearbyRecommendations: getNearbyRecommendationsProcedure,
    getPersonalizedRecommendations: getPersonalizedRecommendationsProcedure,
    dismissRecommendation: dismissRecommendationProcedure,
    getSearchHistory: getSearchHistoryProcedure,
    saveSearchQuery: saveSearchQueryProcedure,
    clearSearchHistory: clearSearchHistoryProcedure,
    getSmartSuggestions: getSmartSuggestionsProcedure,
    getDishOfTheDay: getDishOfTheDayProcedure,
  }),
  reputation: createTRPCRouter({
    getUserReputation: getUserReputationProcedure,
    getLeaderboard: getReputationLeaderboardProcedure,
    awardPoints: awardPointsProcedure,
    getAvailableBadges: getAvailableBadgesProcedure,
    updateTrustScore: updateTrustScoreProcedure,
    getAchievementsSummary: getUserAchievementsSummaryProcedure,
  }),
  messaging: createTRPCRouter({
    getConversations: getConversations,
    getMessages: getMessages,
    sendMessage: sendMessage,
    startConversation: startConversation,
    markAsRead: markAsRead,
    deleteMessage: deleteMessage,
    archiveConversation: archiveConversation,
    blockUser: blockUser,
    getBlockedUsers: getBlockedUsers,
    reportMessage: reportMessage,
    addReaction: addReaction,
    removeReaction: removeReaction,
    getMessageReactions: getMessageReactions,
    setTyping: setTyping,
    getTypingIndicators: getTypingIndicators,
    searchConversations: searchConversations,
    getUnreadCount: getUnreadCount,
  }),
});

export type AppRouter = typeof appRouter;