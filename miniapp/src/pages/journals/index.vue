<script setup lang="ts">
import { ref, computed } from 'vue'
import { onLoad, onShow } from '@dcloudio/uni-app'
import TabBar from '@/components/TabBar.vue'
import { useAppStore } from '@/stores/app'
import { userApi } from '@/api/auth'
import type { Journal } from '@/types'
import { formatDate } from '@/utils'
import Icon from '@/components/Icon.vue'
import { statusBarStyle, navRightStyle } from '@/utils/safe-area'

const appStore = useAppStore()

const activeCategory = ref('全部')
const allJournals = ref<Journal[]>([])
const favorites = ref<Record<string, boolean>>({})
const loading = ref(true)

/** 分类标签由我的旅行册动态生成 */
const categories = computed(() => ['全部', ...appStore.travelBooks.map((b) => b.name)])

/** 按分类（旅行册）过滤游记 */
const journals = computed(() => {
  if (activeCategory.value === '全部') return allJournals.value
  const book = appStore.travelBooks.find((b) => b.name === activeCategory.value)
  if (!book) return allJournals.value
  return allJournals.value.filter((j) => j.bookId === book.id)
})

// 缩略图取自设计稿导出的实拍图（static/photos）
const THUMBS = [
  '/static/photos/journal-1.jpg',
  '/static/photos/journal-2.jpg',
  '/static/photos/journal-3.jpg',
  '/static/photos/journal-4.jpg'
]
function thumbOf(i: number, j?: Journal) {
  const first = j?.images && j.images.length ? j.images[0].url : ''
  return first || THUMBS[i % THUMBS.length]
}

async function loadData() {
  loading.value = true
  try {
    await appStore.init()
    await appStore.ensureLogin()
    await appStore.loadBooks()
    allJournals.value = await userApi.myJournals(50).catch(() => [] as Journal[])
  } finally {
    loading.value = false
  }
}

onLoad(() => {
  loadData()
})

onShow(() => {
  if (appStore.ready && !loading.value) loadData()
})

function goEdit() {
  uni.navigateTo({ url: '/pages/journals/edit' })
}

function goDetail(id: string) {
  uni.navigateTo({ url: `/pages/journals/detail?id=${id}` })
}

function photoCount(j: Journal) {
  return j.images?.length || 0
}

function toggleFav(id: string) {
  favorites.value[id] = !favorites.value[id]
}

function onQuick() {
  uni.navigateTo({ url: '/pages/journals/edit' })
}
</script>

<template>
  <view class="tj-page journals-page">
    <view class="status-bar" :style="statusBarStyle" />

    <view class="header">
      <view class="header-top" :style="navRightStyle">
        <text class="title">我的游记</text>
        <view class="new-btn" @click="goEdit">
          <Icon name="plus" color="#FFFFFF" :weight="1.9" size="26rpx" />
          <text>新建</text>
        </view>
      </view>
      <text class="en-sub">MEMORIES</text>
      <text class="sub-title">把旅途写成自己的章节</text>
    </view>

    <!-- 分类标签 -->
    <scroll-view scroll-x class="category-bar">
      <view
        v-for="c in categories"
        :key="c"
        class="category-tag"
        :class="{ active: activeCategory === c }"
        @click="activeCategory = c"
      >{{ c }}</view>
    </scroll-view>

    <!-- 游记列表 -->
    <view
      v-for="(j, i) in journals"
      :key="j.id"
      class="journal-card tj-card"
      @click="goDetail(j.id)"
    >
      <view class="jc-thumb">
        <image class="jc-img" :src="thumbOf(i, j)" mode="aspectFill" />
      </view>
      <view class="jc-info">
        <text class="jc-title">{{ j.title }}</text>
        <text class="jc-loc">{{ j.locationName || '未记录地点' }}</text>
        <text class="jc-date">{{ formatDate(j.travelDate) }}</text>
        <text class="jc-date">{{ photoCount(j) }} 张照片</text>
      </view>
      <view class="jc-fav" :class="{ faved: favorites[j.id] }" @click.stop="toggleFav(j.id)">
        <Icon
          name="heart"
          :color="favorites[j.id] ? '#E2607E' : '#C4CCC6'"
          :weight="favorites[j.id] ? 2.1 : 1.6"
          size="34rpx"
        />
      </view>
    </view>

    <view v-if="!loading && !journals.length" class="list-empty">
      <text class="le-title">还没有游记</text>
      <text class="le-sub">点右上角「新建」写下第一篇</text>
    </view>

    <TabBar active="books" @quick="onQuick" />
  </view>
</template>

<style lang="scss" scoped>
.journals-page { padding: 0 32rpx calc(240rpx + env(safe-area-inset-bottom)); }

.list-empty {
  margin-top: 60rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10rpx;
  .le-title { font-size: 30rpx; color: #8d9a92; }
  .le-sub { font-size: 23rpx; color: #b6bfb8; }
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
      gap: 8rpx;
      padding: 12rpx 30rpx;
      border-radius: 999rpx;
      background: #2e9e6b;
      color: #fff;
      font-size: 24rpx;
      font-weight: 600;
      box-shadow: 0 6rpx 16rpx rgba(46, 158, 107, 0.28);
    }
  }
  .en-sub { display: block; margin-top: 8rpx; font-size: 22rpx; letter-spacing: 4rpx; color: #a9b5ac; }
  .sub-title { display: block; margin-top: 8rpx; font-size: 36rpx; font-weight: 700; }
}

.category-bar {
  margin-top: 28rpx;
  white-space: nowrap;
  .category-tag {
    display: inline-flex;
    padding: 12rpx 34rpx;
    border-radius: 999rpx;
    background: #ffffff;
    color: #4a5752;
    font-size: 24rpx;
    margin-right: 14rpx;
    &.active {
      background: #1a2e2a;
      color: #ffffff;
      font-weight: 600;
    }
  }
}

.journal-card {
  margin-top: 24rpx;
  display: flex;
  align-items: center;
  padding: 24rpx;
  box-shadow: 0 2rpx 16rpx rgba(0,0,0,0.04);
  .jc-thumb {
    width: 140rpx;
    height: 140rpx;
    border-radius: 20rpx;
    overflow: hidden;
    background: #e8f3ec;
    flex-shrink: 0;
  }
  .jc-img { width: 100%; height: 100%; display: block; }
  .jc-info {
    flex: 1;
    margin-left: 24rpx;
    display: flex;
    flex-direction: column;
    gap: 5rpx;
    min-width: 0;
    .jc-title { font-size: 30rpx; font-weight: 700; color: #1a2e2a; }
    .jc-loc { font-size: 24rpx; color: #9aa39d; }
    .jc-date { font-size: 22rpx; color: #b0b8b2; }
  }
  .jc-fav { padding: 8rpx 0 8rpx 12rpx; margin-left: 8rpx; }
}
</style>
