import {
  createRouter,
  createWebHistory,
} from "vue-router";

import IngameView from "@/views/IngameView.vue";

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),

  routes: [
    {
      path: "/",
      name: "ingame",
      alias: "/ingame",
      component: IngameView,
    },
    {
      path: "/postgame",
      name: "postgame",
      component: () => import("@/views/PostgameView.vue"),
    },
    {
      path: "/:pathMatch(.*)*",
      redirect: "/",
    },
  ],
});

export default router;