import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'login',
    component: () => import('@/views/login/index.vue'),
    meta: { title: '登录' }
  },
  {
    path: '/',
    component: () => import('@/layout/index.vue'),
    redirect: '/dashboard',
    children: [
      {
        path: 'dashboard',
        name: 'dashboard',
        component: () => import('@/views/dashboard/index.vue'),
        meta: { title: '数据看板', icon: 'DataLine' }
      },
      {
        path: 'users',
        name: 'users',
        component: () => import('@/views/users/index.vue'),
        meta: { title: '用户管理', icon: 'User' }
      },
      {
        path: 'trips',
        name: 'trips',
        component: () => import('@/views/trips/index.vue'),
        meta: { title: '旅行册管理', icon: 'Notebook' }
      },
      {
        path: 'journals',
        name: 'journals',
        component: () => import('@/views/journals/index.vue'),
        meta: { title: '游记管理', icon: 'Document' }
      },
      {
        path: 'ledgers',
        name: 'ledgers',
        component: () => import('@/views/ledgers/index.vue'),
        meta: { title: '账本管理', icon: 'Wallet' }
      },
      {
        path: 'system',
        name: 'system',
        component: () => import('@/views/system/index.vue'),
        meta: { title: '系统设置', icon: 'Setting' }
      },
      {
        path: 'logs',
        name: 'logs',
        component: () => import('@/views/logs/index.vue'),
        meta: { title: '操作日志', icon: 'Clock' }
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to, _from, next) => {
  document.title = `${to.meta.title || ''} · 途记后台`
  const token = localStorage.getItem('admin_token')
  if (to.path !== '/login' && !token) {
    next('/login')
  } else {
    next()
  }
})

export default router
