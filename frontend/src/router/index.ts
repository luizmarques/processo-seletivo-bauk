// Vue Router – rotas públicas (login/register) e protegidas (dashboard)
import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  { path: '/', redirect: '/login' },
  { path: '/login', name: 'login', component: () => import('../views/LoginView.vue') },
  { path: '/register', name: 'register', component: () => import('../views/RegisterView.vue') },
  {
    path: '/dashboard',
    name: 'dashboard',
    component: () => import('../views/DashboardView.vue'),
    // Guard de navegação – redireciona para login se não autenticado
    beforeEnter: (_to, _from, next) => {
      const token = localStorage.getItem('token');
      if (!token) {
        next('/login');
      } else {
        next();
      }
    },
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
