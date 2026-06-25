import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const routes = [
  {
    path: '/',
    name: 'login',
    component: () => import('../pages/LoginPage.vue'),
    meta: { requiresGuest: true },
  },
  {
    path: '/register',
    name: 'register',
    component: () => import('../pages/RegisterPage.vue'),
    meta: { requiresGuest: true },
  },
  {
    path: '/orders',
    name: 'orders',
    component: () => import('../pages/OrdersPage.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/landing',
    name: 'landing',
    component: () => import('../pages/LandingPage.vue'),
    meta: { requiresAuth: true },
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach(async (to, from, next) => {
  const auth = useAuthStore()
  if (!auth.hasCheckedAuth) {
    await auth.checkAuth()
    auth.hasCheckedAuth = true
  }

  if (to.meta.requiresAuth && !auth.isAuthenticated) {
    next('/')
    return
  }

  if (to.meta.requiresGuest && auth.isAuthenticated) {
    next('/landing')
    return
  }

  next()
})

export default router
