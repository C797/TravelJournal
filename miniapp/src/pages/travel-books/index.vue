<script setup lang="ts">
import { ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import TabBar from '@/components/TabBar.vue'
import { useAppStore } from '@/stores/app'
import { mockTravelBooks } from '@/mock'

const appStore = useAppStore()
const books = ref(mockTravelBooks)

onLoad(() => {
  appStore.init()
})

function goEdit() {
  uni.navigateTo({ url: '/pages/travel-books/edit' })
}

function goDetail(id: string) {
  uni.navigateTo({ url: `/pages/travel-books/detail?id=${id}` })
}

function onQuick() {
  if (!appStore.hasTravelBook) {
    uni.showModal({
      title: '暂无旅行册',
      content: '暂无旅行册，请先新建旅行册再记录游记',
      confirmText: '去新建旅行册',
      cancelText: '取消',
      success: (res) => {
        if (res.confirm) uni.navigateTo({ url: '/pages/travel-books/edit' })
      }
    })
  } else {
    uni.navigateTo({ url: '/pages/journals/edit' })
  }
}

// 封面 emoji 占位（无真实图片资源时）
const coverEmojis = ['🏔️', '🌊', '🌄']
</script>

<template>
  <view class="tj-page books-page">
    <view class="status-bar"><text class="time">9:41</text></view>

    <view class="header">
      <view class="header-top">
        <text class="title">我的旅行册</text>
        <view class="new-btn" @click="goEdit">
          <text class="plus">＋</text>
          <text>新建</text>
        </view>
      </view>
      <text class="en-sub">TRAVEL COLLECTIONS</text>
      <text class="sub-title">收纳每一次出发</text>
      <text class="sub-desc">按旅程整理地图、游记与共同记账</text>
    </view>

    <!-- 旅行册卡片 -->
    <view
      v-for="(b, i) in books"
      :key="b.id"
      class="book-card"
      :class="{ 'book-card-lg': i === 0 }"
      @click="goDetail(b.id)"
    >
      <view class="book-cover">
        <text class="cover-emoji">{{ coverEmojis[i % coverEmojis.length] }}</text>
        <view class="cover-overlay">
          <text class="cover-ym">{{ b.yearMonth }}</text>
          <text class="cover-name">{{ b.name }}</text>
          <text class="cover-meta">{{ b.journalCount }} 篇游记 · {{ b.spotCount }} 个地点</text>
        </view>
      </view>
    </view>

    <!-- 底部提示 -->
    <view class="prompt-card tj-card">
      <view class="prompt-info">
        <text class="prompt-title">还没有结束的旅程</text>
        <text class="prompt-desc">把下一站也放进你的旅行册</text>
      </view>
      <view class="prompt-btn" @click="goEdit">＋ 新建</view>
    </view>

    <TabBar active="books" @quick="onQuick" />
  </view>
</template>

<style lang="scss" scoped>
.books-page {
  padding: 0 32rpx 160rpx;
}
.status-bar {
  height: 60rpx;
  display: flex;
  align-items: center;
  .time { font-weight: 700; font-size: 30rpx; }
}
.header {
  margin-top: 16rpx;
  .header-top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    .title { font-size: 48rpx; font-weight: 800; }
    .new-btn {
      display: flex;
      align-items: center;
      gap: 6rpx;
      padding: 12rpx 28rpx;
      border-radius: 999rpx;
      background: #fff;
      color: #1a1a1a;
      font-size: 26rpx;
      box-shadow: 0 2rpx 12rpx rgba(0,0,0,0.05);
      .plus { color: #2e9e6b; font-size: 28rpx; }
    }
  }
  .en-sub {
    display: block;
    margin-top: 8rpx;
    font-size: 22rpx;
    letter-spacing: 4rpx;
    color: #9a9a9a;
  }
  .sub-title {
    display: block;
    margin-top: 8rpx;
    font-size: 40rpx;
    font-weight: 700;
    color: #1e3a2f;
  }
  .sub-desc {
    display: block;
    margin-top: 6rpx;
    font-size: 24rpx;
    color: #999;
  }
}

.book-card {
  margin-top: 24rpx;
  border-radius: 32rpx;
  overflow: hidden;
  .book-cover {
    position: relative;
    height: 360rpx;
    background: linear-gradient(135deg, #5f8f74, #3e6a54);
    display: flex;
    align-items: center;
    justify-content: center;
    .cover-emoji { font-size: 100rpx; }
    .cover-overlay {
      position: absolute;
      left: 0;
      right: 0;
      bottom: 0;
      padding: 32rpx;
      background: linear-gradient(transparent, rgba(0,0,0,0.55));
      display: flex;
      flex-direction: column;
      gap: 6rpx;
      .cover-ym { font-size: 22rpx; color: rgba(255,255,255,0.8); }
      .cover-name { font-size: 40rpx; font-weight: 700; color: #fff; }
      .cover-meta { font-size: 24rpx; color: rgba(255,255,255,0.85); }
    }
  }
}
.book-card-lg .book-cover { height: 440rpx; }

.prompt-card {
  margin-top: 24rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 32rpx;
  .prompt-info {
    display: flex;
    flex-direction: column;
    gap: 6rpx;
    .prompt-title { font-size: 30rpx; font-weight: 700; }
    .prompt-desc { font-size: 24rpx; color: #999; }
  }
  .prompt-btn {
    padding: 12rpx 28rpx;
    border-radius: 999rpx;
    background: #e8f3ec;
    color: #2e9e6b;
    font-size: 26rpx;
  }
}
</style>
