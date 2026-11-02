<script setup lang="ts">
import { ref, computed } from 'vue'
import { onShow, onLoad } from '@dcloudio/uni-app'
import TabBar from '@/components/TabBar.vue'
import ChinaMap from '@/components/ChinaMap.vue'
import Icon from '@/components/Icon.vue'
import { useAppStore } from '@/stores/app'
import { statusBarStyle, navRightStyle } from '@/utils/safe-area'
import { userApi } from '@/api/auth'
import type { MapSpot, Journal } from '@/types'
import { formatDate } from '@/utils'

const appStore = useAppStore()

/** 我的全部标注点（跨旅行册） */
const mySpots = ref<MapSpot[]>([])
/** 最近游记 */
const stories = ref<Journal[]>([])
const loading = ref(true)

/** 当前旅程：取最近创建的旅行册 */
const currentBook = computed(() => appStore.travelBooks[0] || null)

/** 地图点位：已到访绿 / 规划中橙 */
const cities = computed(() =>
  mySpots.value
    .filter((s) => s.longitude != null && s.latitude != null)
    .map((s) => ({
      name: s.city || s.locationName,
      status: (s.markStatus === 'visited' ? 'visited' : 'planned') as 'visited' | 'planned',
      lng: s.longitude as number,
      lat: s.latitude as number
    }))
)

/** 已点亮城市数 */
const litCities = computed(() => mySpots.value.filter((s) => s.markStatus === 'visited').length)

// 封面取自设计稿导出的实拍图（static/photos）
const COVERS = [
  '/static/photos/story-cover.jpg',
  '/static/photos/journal-2.jpg',
  '/static/photos/journal-1.jpg'
]
function storyCover(j: Journal, i: number) {
  // 优先用游记首图，无图时用本地占位图
  const first = j.images && j.images.length ? j.images[0].url : ''
  return first || COVERS[i % COVERS.length]
}

async function loadData() {
  loading.value = true
  try {
    await appStore.init()
    await appStore.ensureLogin()
    const [spots, journals] = await Promise.all([
      userApi.mySpots().catch(() => [] as MapSpot[]),
      userApi.myJournals(3).catch(() => [] as Journal[])
    ])
    mySpots.value = spots
    stories.value = journals
  } finally {
    loading.value = false
  }
}

onLoad(() => {
  loadData()
})

onShow(() => {
  // 从其他页返回时刷新，保证新增内容即时可见
  if (appStore.ready) {
    loadData()
  }
})

function goFootprint() {
  uni.navigateTo({ url: '/pages/spots/index' })
}

function goAllJournals() {
  uni.navigateTo({ url: '/pages/journals/index' })
}

function goBookDetail() {
  if (!currentBook.value) return
  uni.navigateTo({ url: `/pages/travel-books/detail?id=${currentBook.value.id}` })
}

function goJournalDetail(id: string) {
  uni.navigateTo({ url: `/pages/journals/detail?id=${id}` })
}

// 快捷记录：先校验是否已有旅行册
function onQuickRecord() {
  if (!appStore.hasTravelBook) {
    uni.showModal({
      title: '暂无旅行册',
      content: '暂无旅行册，请先新建旅行册再记录游记',
      confirmText: '去新建旅行册',
      cancelText: '取消',
      success: (res) => {
        if (res.confirm) {
          uni.navigateTo({ url: '/pages/travel-books/edit' })
        }
      }
    })
  } else {
    uni.navigateTo({ url: '/pages/journals/edit' })
  }
}
</script>

<template>
  <view class="tj-page index-page">
    <!-- 状态栏占位（高度按机型自适应） -->
    <view class="status-bar" :style="statusBarStyle" />

    <!-- 标题区 -->
    <view class="header">
      <view class="header-top" :style="navRightStyle">
        <text class="title">途记</text>
        <view class="footprint-btn" @click="goFootprint">
          <Icon name="locate" color="#FFFFFF" :weight="1.9" size="26rpx" />
          <text>旅行足迹</text>
        </view>
      </view>
      <view class="slogan">
        <text>把走过的路</text>
        <text>变成自己的故事。</text>
      </view>
      <text class="en-slogan">CHINA FOOTPRINT</text>
    </view>

    <!-- 我的足迹地图 -->
    <view class="map-card">
      <text class="map-title">我的足迹地图</text>
      <ChinaMap :cities="cities" :lit-count="litCities" />
    </view>

    <!-- 本次旅程 -->
    <view class="trip-card tj-card" @click="goBookDetail">
      <view class="trip-info">
        <text class="trip-label">本次旅程</text>
        <text class="trip-name">{{ currentBook ? currentBook.name : '暂无旅程' }}</text>
        <text class="trip-date">
          {{
            currentBook
              ? formatDate(currentBook.startTime) + ' — ' + formatDate(currentBook.endTime)
              : '点击新建你的第一本旅行册'
          }}
        </text>
      </view>
      <view class="trip-divider" />
      <view class="trip-count">
        <text class="count-num">{{ currentBook ? currentBook.spotCount || 0 : 0 }}</text>
        <text class="count-label">处足迹</text>
      </view>
    </view>

    <!-- 最近的故事 -->
    <view class="stories">
      <view class="stories-header">
        <text class="stories-title">最近的故事</text>
        <text class="stories-all" @click="goAllJournals">全部游记 ›</text>
      </view>
      <view
        v-for="(j, i) in stories"
        :key="j.id"
        class="story-card tj-card"
        @click="goJournalDetail(j.id)"
      >
        <view class="story-thumb">
          <image class="thumb-img" :src="storyCover(j, i)" mode="aspectFill" />
        </view>
        <view class="story-info">
          <text class="story-title">{{ j.title }}</text>
          <text class="story-loc">{{ j.locationName || '未记录地点' }}</text>
          <text class="story-excerpt">{{ j.content }}</text>
        </view>
        <text class="story-date">{{ formatDate(j.travelDate) }}</text>
      </view>

      <view v-if="!loading && !stories.length" class="story-empty">
        <text class="se-title">还没有游记</text>
        <text class="se-sub">记录下第一次出发吧</text>
      </view>
    </view>

    <TabBar active="home" @quick="onQuickRecord" />
  </view>
</template>

<style lang="scss" scoped>
.index-page {
  padding: 0 32rpx calc(240rpx + env(safe-area-inset-bottom));
}

/* 高度由 safe-area.ts 注入，勿写死 */
.status-bar {
  width: 100%;
}

.header {
  margin-top: 16rpx;
  .header-top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    .title {
      font-size: 56rpx;
      font-weight: 800;
    }
    .footprint-btn {
      display: flex;
      align-items: center;
      gap: 8rpx;
      padding: 14rpx 28rpx;
      border-radius: 999rpx;
      background: #2e9e6b;
      color: #fff;
      font-size: 26rpx;
      .loc-icon {
        font-size: 26rpx;
      }
    }
  }
  .slogan {
    display: flex;
    flex-direction: column;
    margin-top: 16rpx;
    font-size: 36rpx;
    font-weight: 600;
    color: #2d5240;
  }
  .en-slogan {
    display: block;
    margin-top: 8rpx;
    font-size: 22rpx;
    letter-spacing: 6rpx;
    color: #a9b5ac;
  }
}

.map-card {
  margin-top: 32rpx;
  background: #eaf0ea;
  border-radius: 32rpx;
  padding: 28rpx;
  .map-title {
    font-size: 30rpx;
    font-weight: 700;
    color: #1a1a1a;
  }
}

.trip-card {
  margin-top: 24rpx;
  display: flex;
  align-items: center;
  padding: 32rpx;
  .trip-info {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 6rpx;
    .trip-label {
      font-size: 22rpx;
      color: #999;
    }
    .trip-name {
      font-size: 36rpx;
      font-weight: 700;
    }
    .trip-date {
      font-size: 24rpx;
      color: #999;
    }
  }
  .trip-divider {
    width: 1rpx;
    height: 80rpx;
    background: #eee;
    margin: 0 32rpx;
  }
  .trip-count {
    display: flex;
    flex-direction: column;
    align-items: center;
    .count-num {
      font-size: 48rpx;
      font-weight: 700;
      color: #2e9e6b;
    }
    .count-label {
      font-size: 22rpx;
      color: #999;
    }
  }
}

.stories {
  margin-top: 32rpx;
  .stories-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 20rpx;
    .stories-title {
      font-size: 32rpx;
      font-weight: 700;
    }
    .stories-all {
      font-size: 26rpx;
      color: #2e9e6b;
    }
  }
  .story-card {
    display: flex;
    align-items: center;
    padding: 24rpx;
    margin-bottom: 16rpx;
    .thumb-img {
      width: 100%;
      height: 100%;
      display: block;
      border-radius: 16rpx;
    }
    .story-thumb {
      width: 120rpx;
      height: 120rpx;
      border-radius: 16rpx;
      overflow: hidden;
      background: #e8f3ec;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      .thumb-placeholder {
        font-size: 52rpx;
      }
    }
    .story-info {
      flex: 1;
      margin-left: 24rpx;
      display: flex;
      flex-direction: column;
      gap: 6rpx;
      overflow: hidden;
      .story-title {
        font-size: 28rpx;
        font-weight: 700;
      }
      .story-loc {
        font-size: 22rpx;
        color: #9aa79d;
      }
      .story-excerpt {
        font-size: 22rpx;
        color: #999;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
    }
    .story-date {
      font-size: 22rpx;
      color: #999;
      align-self: flex-start;
      margin-left: 16rpx;
    }
  }

  .story-empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 60rpx 0;
    gap: 8rpx;
    .se-title {
      font-size: 28rpx;
      color: #8d9a92;
    }
    .se-sub {
      font-size: 22rpx;
      color: #b6bfb8;
    }
  }
}
</style>
