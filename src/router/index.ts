// ============================================================
// 路由配置 - Rocket.Chat 适配版
// ============================================================

import { createRouter, createWebHistory, createWebHashHistory } from 'vue-router'
import { isLogin } from '@/utils/auth'

const routerMode: 'history' | 'hash' =
  import.meta.env.VITE_ROUTER_MODE === 'hash' ? 'hash' : 'history'

const router = createRouter({
  history:
    routerMode === 'hash'
      ? createWebHashHistory(import.meta.env.VITE_BASE)
      : createWebHistory(import.meta.env.VITE_BASE),
  routes: [
    {
      path: '/login',
      name: 'Login',
      component: () => import('@/views/auth/LoginView.vue'),
      meta: { requiresAuth: false }
    },
    {
      path: '/register',
      name: 'Register',
      component: () => import('@/views/auth/RegisterView.vue'),
      meta: { requiresAuth: false }
    },
    {
      path: '/',
      name: 'Chat',
      component: () => import('@/views/chat/ChatView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/setting',
      name: 'Setting',
      component: () => import('@/views/chat/ChatView.vue'), // 后续可拆分独立设置页
      meta: { requiresAuth: true }
    },
    // 404 兜底
    {
      path: '/:pathMatch(.*)*',
      redirect: '/'
    }
  ]
})

// ---- 路由守卫：未登录重定向到登录页 ----
router.beforeEach((to, _from, next) => {
  const requiresAuth = to.meta?.requiresAuth !== false

  if (requiresAuth && !isLogin()) {
    next('/login')
  } else if (to.path === '/login' && isLogin()) {
    next('/')
  } else {
    next()
  }
})

export default router
