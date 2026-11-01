<script setup lang="ts">
import { ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import TabBar from '@/components/TabBar.vue'
import { useAppStore } from '@/stores/app'

const appStore = useAppStore()

const stats = [
  { num: '03', label: '旅行册' },
  { num: '12', label: '篇游记' },
  { num: '18', label: '个地点' },
  { num: '26', label: '笔账单' }
]

const contentItems = [
  { name: '我的旅行册', desc: '3 段旅程', icon: '📁', path: '/pages/travel-books/index' },
  { name: '我的游记', desc: '12 篇记录', icon: '📄', path: '/pages/journals/index' },
  { name: '我的足迹', desc: '18 个地点', icon: '📍', path: '/pages/spots/index' },
  { name: '我的账单', desc: '26 笔收支', icon: '📒', path: '/pages/ledger/index' }
]

const serviceItems = [
  { name: '数据导出', icon: '⬇️', action: 'export' },
  { name: '设置', icon: '⚙️', action: 'setting' },
  { name: '意见反馈', icon: '💬', action: 'feedback' },
  { name: '关于途记', icon: 'ℹ️', action: 'about' }
]

onLoad(() => {
  appStore.init()
})

function goContent(path: string) {
  if (path === '/pages/travel-books/index' || path === '/pages/ledger/index') {
    uni.switchTab({ url: path })
  } else {
    uni.navigateTo({ url: path })
  }
}

function onService(action: string) {
  if (action === 'export') {
    uni.showToast({ title: '正在导出数据…', icon: 'none' })
  } else {
    uni.showToast({ title: '功能建设中', icon: 'none' })
  }
}

function onQuick() {
  uni.navigateTo({ url: '/pages/journals/edit' })
}
</script>

<template>
  <view class="tj-page mine-page">
    <view class="status-bar"><text class="time">9:41</text></view>

    <view class="header">
      <text class="title">我的</text>
    </view>

    <!-- 用户卡片 -->
    <view class="user-card">
      <view class="uc-top">
        <view class="uc-avatar"><text>王</text></view>
        <view class="uc-info">
          <text class="uc-name">{{ appStore.user?.nickname || '旅行者小王' }}</text>
          <text class="uc-sign">{{ appStore.user?.signature || '把世界装进记忆里' }}</text>
        </view>
        <text class="uc-id">ID 10086</text>
      </view>
      <view class="uc-divider" />
      <view class="uc-stats">
        <view v-for="s in stats" :key="s.label" class="uc-stat">
          <text class="uc-num">{{ s.num }}</text>
          <text class="uc-label">{{ s.label }}</text>
        </view>
      </view>
    </view>

    <!-- 我的内容 -->
    <view class="section">
      <text class="section-title">我的内容</text>
      <view class="menu-card tj-card">
        <view v-for="(item, i) in contentItems" :key="item.name" class="menu-item" @click="goContent(item.path)">
          <view class="mi-icon"><text>{{ item.icon }}</text></view>
          <text class="mi-name">{{ item.name }}</text>
          <text class="mi-desc">{{ item.desc }}</text>
          <text class="mi-arrow">›</text>
          <view v-if="i < contentItems.length - 1" class="mi-divider" />
        </view>
      </view>
    </view>

    <!-- 更多服务 -->
    <view class="section">
      <text class="section-title">更多服务</text>
      <view class="menu-card tj-card">
        <view v-for="(item, i) in serviceItems" :key="item.name" class="menu-item" @click="onService(item.action)">
          <view class="mi-icon"><text>{{ item.icon }}</text></view>
          <text class="mi-name">{{ item.name }}</text>
          <text class="mi-arrow">›</text>
          <view v-if="i < serviceItems.length - 1" class="mi-divider" />
        </view>
      </view>
    </view>

    <TabBar active="mine" @quick="onQuick" />
  </view>
</template>

<style lang="scss" scoped>
.mine-page { padding: 0 32rpx 160rpx; }
.status-bar { height: 60rpx; display: flex; align-items: center; .time { font-weight: 700; font-size: 30rpx; } }

.header {
  margin-top: 16rpx;
  .title { font-size: 48rpx; font-weight: 800; }
}

.user-card {
  margin-top: 24rpx;
  background: #2d5240;
  border-radius: 32rpx;
  padding: 36rpx;
  .uc-top {
    display: flex;
    align-items: center;
    .uc-avatar {
      width: 110rpx;
      height: 110rpx;
      border-radius: 50%;
      background: #fff;
      color: #2d5240;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 48rpx;
      font-weight: 700;
    }
    .uc-info {
      flex: 1;
      margin-left: 24rpx;
      display: flex;
      flex-direction: column;
      gap: 8rpx;
      .uc-name { font-size: 36rpx; font-weight: 700; color: #fff; }
      .uc-sign { font-size: 24rpx; color: #b8cdc0; }
    }
    .uc-id { font-size: 24rpx; color: #9db8a5; }
  }
  .uc-divider { height: 1rpx; background: rgba(255,255,255,0.15); margin: 32rpx 0; }
  .uc-stats {
    display: flex;
    .uc-stat {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8rpx;
      .uc-num { font-size: 40rpx; font-weight: 700; color: #fff; }
      .uc-label { font-size: 22rpx; color: #9db8a5; }
    }
  }
}

.section {
  margin-top: 32rpx;
  .section-title { font-size: 30rpx; font-weight: 700; display: block; margin-bottom: 16rpx; }
}

.menu-card {
  padding: 0 28rpx;
  .menu-item {
    position: relative;
    display: flex;
    align-items: center;
    padding: 28rpx 0;
    .mi-icon {
      width: 64rpx;
      height: 64rpx;
      border-radius: 16rpx;
      background: #e8f3ec;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 32rpx;
    }
    .mi-name { margin-left: 20rpx; font-size: 28rpx; font-weight: 600; }
    .mi-desc { margin-left: auto; margin-right: 12rpx; font-size: 22rpx; color: #999; }
    .mi-arrow { font-size: 32rpx; color: #999; }
    .mi-divider {
      position: absolute;
      left: 84rpx;
      right: 0;
      bottom: 0;
      height: 1rpx;
      background: #f0f0f0;
    }
  }
}
</style>
