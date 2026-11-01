<template>
  <div class="layout">
    <!-- 侧边栏 -->
    <aside class="sidebar">
      <div class="logo">
        <div class="logo-icon">途</div>
        <span class="logo-text">途记后台</span>
      </div>
      <nav class="menu">
        <router-link
          v-for="item in menuItems"
          :key="item.path"
          :to="item.path"
          class="menu-item"
          :class="{ active: route.path === item.path }"
        >
          <span class="menu-icon">{{ item.icon }}</span>
          <span>{{ item.title }}</span>
        </router-link>
        <div class="menu-divider" />
        <router-link
          v-for="item in systemItems"
          :key="item.path"
          :to="item.path"
          class="menu-item"
          :class="{ active: route.path === item.path }"
        >
          <span class="menu-icon">{{ item.icon }}</span>
          <span>{{ item.title }}</span>
        </router-link>
      </nav>
      <div class="admin-card">
        <div class="admin-avatar">管</div>
        <div class="admin-info">
          <span class="admin-name">管理员</span>
          <span class="admin-role">超级管理员</span>
        </div>
      </div>
    </aside>

    <!-- 主内容 -->
    <div class="main">
      <header class="topbar">
        <h1 class="page-title">{{ route.meta.title }}</h1>
        <div class="topbar-right">
          <div class="search-box">
            <span class="search-icon">🔍</span>
            <input placeholder="搜索用户、旅行册、游记…" />
          </div>
          <button class="bell-btn">🔔</button>
          <div class="topbar-avatar">管</div>
        </div>
      </header>
      <div class="content">
        <router-view />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRoute } from 'vue-router'

const route = useRoute()

const menuItems = [
  { path: '/dashboard', title: '数据看板', icon: '📊' },
  { path: '/users', title: '用户管理', icon: '👤' },
  { path: '/trips', title: '旅行册管理', icon: '📚' },
  { path: '/journals', title: '游记管理', icon: '📝' },
  { path: '/ledgers', title: '账本管理', icon: '💰' }
]

const systemItems = [
  { path: '/system', title: '系统设置', icon: '⚙️' },
  { path: '/logs', title: '操作日志', icon: '🕐' }
]
</script>

<style scoped>
.layout {
  display: flex;
  height: 100%;
}
.sidebar {
  width: 200px;
  background: #1e3a2f;
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
}
.logo {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 24px 20px;
}
.logo-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: #2e9e6b;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  font-weight: 700;
}
.logo-text {
  color: #fff;
  font-size: 18px;
  font-weight: 700;
}
.menu {
  flex: 1;
  padding: 8px 12px;
}
.menu-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border-radius: 10px;
  color: #b8c4c0;
  text-decoration: none;
  font-size: 14px;
  margin-bottom: 4px;
}
.menu-item:hover {
  background: rgba(255, 255, 255, 0.06);
}
.menu-item.active {
  background: #2e9e6b;
  color: #fff;
}
.menu-icon {
  font-size: 16px;
}
.menu-divider {
  height: 1px;
  background: rgba(255, 255, 255, 0.1);
  margin: 16px 8px;
}
.admin-card {
  margin: 16px;
  padding: 16px;
  background: rgba(0, 0, 0, 0.18);
  border-radius: 12px;
  display: flex;
  align-items: center;
  gap: 12px;
}
.admin-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: #2e9e6b;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
}
.admin-info {
  display: flex;
  flex-direction: column;
}
.admin-name {
  color: #fff;
  font-size: 14px;
  font-weight: 600;
}
.admin-role {
  color: #8fa39a;
  font-size: 12px;
}
.main {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}
.topbar {
  height: 64px;
  background: #fff;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.04);
}
.page-title {
  font-size: 18px;
  font-weight: 700;
  color: #1f2937;
}
.topbar-right {
  display: flex;
  align-items: center;
  gap: 16px;
}
.search-box {
  display: flex;
  align-items: center;
  gap: 8px;
  background: #f3f4f6;
  border-radius: 20px;
  padding: 8px 16px;
  width: 260px;
}
.search-icon {
  font-size: 14px;
  opacity: 0.5;
}
.search-box input {
  border: none;
  outline: none;
  background: transparent;
  font-size: 13px;
  width: 100%;
  color: #333;
}
.bell-btn {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: 1px solid #e5e7eb;
  background: #fff;
  cursor: pointer;
  font-size: 16px;
}
.topbar-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: #2e9e6b;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
}
.content {
  flex: 1;
  overflow: auto;
  padding: 24px;
}
</style>
