import { createRouter, createWebHistory } from 'vue-router';
import AdminPage from '../pages/AdminPage.vue';
import ForbiddenPage from '../pages/ForbiddenPage.vue';
import HomePage from '../pages/HomePage.vue';
import LoginPage from '../pages/LoginPage.vue';
import OpsCenterPage from '../pages/OpsCenterPage.vue';
import { useAuthStore } from '../stores/auth';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', component: HomePage, meta: { requiresAuth: true } },
    {
      path: '/admin',
      component: AdminPage,
      meta: { requiresAuth: true, requiredPermission: 'users:admin' },
    },
    {
      path: '/ops',
      component: OpsCenterPage,
      meta: { requiresAuth: true, requiredPermission: 'org:manage' },
    },
    { path: '/forbidden', component: ForbiddenPage },
    { path: '/login', component: LoginPage },
  ],
});

router.beforeEach(async (to) => {
  const auth = useAuthStore();

  if (to.meta.requiresAuth && !auth.isAuthed) {
    return '/login';
  }

  if (to.meta.requiresAuth && auth.isAuthed) {
    try {
      await auth.refresh();
    } catch {
      return '/login';
    }
  }

  const requiredPermission = to.meta.requiredPermission as string | undefined;
  if (requiredPermission && !auth.hasPermission(requiredPermission)) {
    return '/forbidden';
  }

  return true;
});

export default router;
