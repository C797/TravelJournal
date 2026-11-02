<script setup lang="ts">
import { computed } from 'vue'
import { onLoad, onShow } from '@dcloudio/uni-app'
import TabBar from '@/components/TabBar.vue'
import { useAppStore } from '@/stores/app'
import { statusBarStyle, navRightStyle } from '@/utils/safe-area'

const appStore = useAppStore()

/** 旅行册列表统一来自 store，新建后返回本页自动更新 */
const books = computed(() => appStore.travelBooks)

async function loadData() {
  await appStore.init()
  await appStore.ensureLogin()
  await appStore.loadBooks()
}

onLoad(() => {
  loadData()
})

onShow(() => {
  if (appStore.ready) appStore.loadBooks()
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

// 封面：优先用旅行册自定义封面，否则用本地实拍占位图
const COVERS = [
  '/static/photos/book-chuanxi.jpg',
  '/static/photos/book-xiamen.jpg',
  '/static/photos/book-yunnan.jpg'
]
function coverOf(book: { coverUrl?: string } | null, i: number) {
  if (book?.coverUrl) return book.coverUrl
  return COVERS[i % COVERS.length]
}
</script>

<template>
  <view class="tj-page books-page">
    <view class="status-bar" :style="statusBarStyle" />

    <view class="header">
      <view class="header-top" :style="navRightStyle">
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

    <!-- 旅行册卡片：首张通栏，其余两列（与画板一致） -->
    <view
      v-for="b in books.slice(0, 1)"
      :key="b.id"
      class="book-card book-card-lg"
      :style="{ backgroundImage: `url(${coverOf(b, 0)})` }"
      @click="goDetail(b.id)"
    >
      <view class="cover-ym">{{ b.yearMonth }}</view>
      <view class="cover-name">{{ b.name }}</view>
      <view class="cover-meta">{{ b.journalCount || 0 }} 篇游记 · {{ b.spotCount || 0 }} 个地点</view>
    </view>

    <view class="book-grid">
      <view
        v-for="(b, i) in books.slice(1)"
        :key="b.id"
        class="book-card book-card-sm"
        :style="{ backgroundImage: `url(${coverOf(b, i + 1)})` }"
        @click="goDetail(b.id)"
      >
        <view class="cover-ym">{{ b.yearMonth }}</view>
        <view class="cover-name">{{ b.name }}</view>
        <view class="cover-meta">{{ b.journalCount || 0 }} 篇游记</view>
      </view>
    </view>

    <!-- 空态：还没有旅行册 -->
    <view v-if="!books.length" class="empty-books tj-card">
      <text class="eb-title">还没有旅行册</text>
      <text class="eb-desc">创建第一本，开始记录你的旅程</text>
      <view class="eb-btn" @click="goEdit">＋ 新建旅行册</view>
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
  padding: 0 32rpx calc(240rpx + env(safe-area-inset-bottom));
}

.empty-books {
  margin-top: 40rpx;
  padding: 64rpx 32rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12rpx;
  .eb-title {
    font-size: 32rpx;
    font-weight: 700;
    color: #1a2e2a;
  }
  .eb-desc {
    font-size: 24rpx;
    color: #9aa39d;
  }
  .eb-btn {
    margin-top: 16rpx;
    padding: 18rpx 44rpx;
    border-radius: 999rpx;
    background: #2e9e6b;
    color: #fff;
    font-size: 26rpx;
    font-weight: 600;
  }
}
/* 高度由 utils/safe-area.ts 按机型注入 */
.status-bar {
  width: 100%;
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
  position: relative;
  margin-top: 28rpx;
  border-radius: 32rpx;
  overflow: hidden;
  background-color: #dfe9e2;
  background-size: cover;
  background-position: center;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  padding: 28rpx 30rpx;
  box-sizing: border-box;

  /* 底部压暗，保证白字可读 */
  &::after {
    content: '';
    position: absolute;
    left: 0;
    right: 0;
    bottom: 0;
    height: 60%;
    background: linear-gradient(transparent, rgba(10, 24, 18, 0.66));
    pointer-events: none;
  }

  .cover-ym,
  .cover-name,
  .cover-meta {
    position: relative;
    z-index: 1;
  }

  .cover-ym {
    font-size: 22rpx;
    color: rgba(255, 255, 255, 0.82);
    letter-spacing: 1rpx;
    line-height: 1.3;
  }
  .cover-name {
    margin-top: 8rpx;
    font-size: 44rpx;
    font-weight: 700;
    color: #ffffff;
    letter-spacing: 1rpx;
    line-height: 1.24;
  }
  .cover-meta {
    margin-top: 6rpx;
    font-size: 24rpx;
    color: rgba(255, 255, 255, 0.82);
    line-height: 1.35;
  }
}

.book-card-lg {
  height: 304rpx;
}

.book-grid {
  display: flex;
  gap: 20rpx;
  margin-top: 20rpx;
}

.book-card-sm {
  flex: 1;
  margin-top: 0;
  height: 324rpx;
  padding: 22rpx 20rpx;

  .cover-name {
    font-size: 32rpx;
  }
  .cover-meta {
    font-size: 22rpx;
  }
}

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
