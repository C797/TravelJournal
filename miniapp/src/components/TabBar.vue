<!-- 底部导航栏（严格对齐画板：390×94 容器 / 24 padding / 白胶囊 r32 / 选中项绿色胶囊 r26） -->
<script setup lang="ts">
import { computed } from 'vue'
import Icon from '@/components/Icon.vue'

const props = defineProps<{
  active: 'home' | 'books' | 'ledger' | 'mine'
}>()

const emit = defineEmits<{ (e: 'quick'): void }>()

const tabs = [
  { key: 'home' as const, text: '首页', path: '/pages/index/index', icon: 'home' },
  { key: 'books' as const, text: '旅行册', path: '/pages/travel-books/index', icon: 'list' }
]

const tabsRight = [
  { key: 'ledger' as const, text: '账本', path: '/pages/ledger/index', icon: 'card' },
  { key: 'mine' as const, text: '我的', path: '/pages/mine/index', icon: 'user' }
]

const isActive = (key: string) => props.active === key

function go(path: string) {
  uni.reLaunch({ url: path })
}

function onQuick() {
  emit('quick')
}
</script>

<template>
  <view class="tabbar">
    <view class="pill">
      <view
        v-for="tab in tabs"
        :key="tab.key"
        class="tab-item"
        :class="{ active: isActive(tab.key) }"
        @click="go(tab.path)"
      >
        <Icon
          :name="tab.icon"
          :color="isActive(tab.key) ? '#FFFFFF' : '#6B7A74'"
          size="36rpx"
          :weight="1.7"
        />
        <text class="tab-text">{{ tab.text }}</text>
      </view>

      <!-- 中间快速记录 -->
      <view class="quick-cell" @click="onQuick">
        <view class="fab">
          <Icon name="plus" color="#FFFFFF" :weight="1.9" size="40rpx" />
        </view>
      </view>

      <view
        v-for="tab in tabsRight"
        :key="tab.key"
        class="tab-item"
        :class="{ active: isActive(tab.key) }"
        @click="go(tab.path)"
      >
        <Icon
          :name="tab.icon"
          :color="isActive(tab.key) ? '#FFFFFF' : '#6B7A74'"
          size="36rpx"
          :weight="1.7"
        />
        <text class="tab-text">{{ tab.text }}</text>
      </view>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.tabbar {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  /* 底部安全区：iPhone 全面屏的横条高度自适应 */
  height: calc(188rpx + env(safe-area-inset-bottom));
  padding: 24rpx 48rpx calc(40rpx + env(safe-area-inset-bottom));
  box-sizing: border-box;
  z-index: 100;
}

.pill {
  display: flex;
  align-items: center;
  height: 124rpx;
  padding: 8rpx;
  box-sizing: border-box;
  background: #ffffff;
  border-radius: 64rpx;
  box-shadow: 0 12rpx 36rpx rgba(26, 46, 42, 0.1);
}

.tab-item {
  flex: 1;
  height: 108rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8rpx;
  border-radius: 52rpx;
  transition: background 0.2s;

  &.active {
    background: #2e9e6b;

    .tab-text {
      color: #ffffff;
      font-weight: 600;
    }
  }
}

.tab-text {
  font-size: 20rpx;
  line-height: 1;
  font-weight: 500;
  color: #6b7a74;
}

.quick-cell {
  flex: 1;
  height: 108rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.fab {
  width: 92rpx;
  height: 92rpx;
  border-radius: 46rpx;
  background: #2e9e6b;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8rpx 20rpx rgba(46, 158, 107, 0.38);
}
</style>
