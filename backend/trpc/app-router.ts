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
});

export type AppRouter = typeof appRouter;