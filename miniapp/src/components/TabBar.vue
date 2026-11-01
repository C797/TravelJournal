// 底部导航栏组件（4 Tab + 中间悬浮 +）
<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  active: 'home' | 'books' | 'ledger' | 'mine'
}>()

const iconMap: Record<string, string> = {
  home: '🏠',
  book: '📚',
  wallet: '📒',
  user: '👤'
}

const tabs = [
  { key: 'home' as const, text: '首页', path: '/pages/index/index', icon: 'home' },
  { key: 'books' as const, text: '旅行册', path: '/pages/travel-books/index', icon: 'book' },
  { key: 'ledger' as const, text: '账本', path: '/pages/ledger/index', icon: 'wallet' },
  { key: 'mine' as const, text: '我的', path: '/pages/mine/index', icon: 'user' }
]

const emit = defineEmits<{ (e: 'quick'): void }>()

function go(path: string) {
  uni.switchTab({ url: path })
}

function onQuick() {
  emit('quick')
}
</script>

<template>
  <view class="tabbar">
    <view
      v-for="tab in tabs"
      :key="tab.key"
      class="tab-item"
      :class="{ active: props.active === tab.key }"
      @click="go(tab.path)"
    >
      <view class="tab-icon-wrap">
        <text class="tab-icon">{{ iconMap[tab.icon] }}</text>
      </view>
      <text class="tab-text">{{ tab.text }}</text>
    </view>

    <!-- 中间悬浮 + -->
    <view class="fab" @click="onQuick">
      <text class="fab-plus">＋</text>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.tabbar {
  position: fixed;
  left: 24rpx;
  right: 24rpx;
  bottom: 24rpx;
  height: 120rpx;
  background: #ffffff;
  border-radius: 999rpx;
  display: flex;
  align-items: center;
  justify-content: space-around;
  box-shadow: 0 8rpx 32rpx rgba(0, 0, 0, 0.08);
  z-index: 100;
}

.tab-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 120rpx;
  gap: 4rpx;

  .tab-icon-wrap {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 64rpx;
    height: 64rpx;
    border-radius: 50%;
  }
  .tab-icon {
    font-size: 40rpx;
    filter: grayscale(1);
    opacity: 0.45;
  }
  .tab-text {
    font-size: 20rpx;
    color: #999999;
  }

  &.active {
    .tab-icon-wrap {
      background: #2e9e6b;
    }
    .tab-icon {
      filter: none;
      opacity: 1;
    }
    .tab-text {
      color: #2e9e6b;
      font-weight: 600;
    }
  }
}

.fab {
  position: absolute;
  top: -40rpx;
  left: 50%;
  transform: translateX(-50%);
  width: 104rpx;
  height: 104rpx;
  border-radius: 50%;
  background: linear-gradient(135deg, #34a866, #2e9e6b);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8rpx 20rpx rgba(46, 158, 107, 0.4);
  border: 6rpx solid #ffffff;

  .fab-plus {
    color: #ffffff;
    font-size: 52rpx;
    font-weight: 300;
    line-height: 1;
  }
}
</style>
