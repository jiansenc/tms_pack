import { createWebHashHistory, createRouter } from 'vue-router';
import Layout from '@/components/Layout.vue';
const routes = [
  {
    path: '/',
    component: Layout,
    children: [
      {
        path: '/',
        component: () => import('@/views/index.vue'),
      },
      {
        path: 'translation',
        component: () => import('@/views/translation.vue'),
      },
      {
        path: 'packaged',
        component: () => import('@/views/packaged.vue'),
      },
    ],
  },
];

const router = createRouter({
  history: createWebHashHistory(),
  routes,
});

export default router;
