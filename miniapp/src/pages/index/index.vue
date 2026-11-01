<script setup lang="ts">
import { ref } from 'vue'
import { onShow, onLoad } from '@dcloudio/uni-app'
import TabBar from '@/components/TabBar.vue'
import { useAppStore } from '@/stores/app'
import { mockFootprintCities, mockTravelBooks, mockJournals } from '@/mock'
import { formatDate } from '@/utils'

function dotStyle(c: { lng: number; lat: number }) {
  // 简化：按经纬度粗映射到地图占位区域百分比
  const x = ((c.lng - 73) / (135 - 73)) * 88 + 4
  const y = ((54 - c.lat) / (54 - 18)) * 78 + 8
  return { left: `${x}%`, top: `${y}%` }
}

const appStore = useAppStore()

const litCities = ref(12)
const cities = ref(mockFootprintCities)
const currentBook = ref(mockTravelBooks[0])
const stories = ref(mockJournals.slice(0, 3))

onLoad(() => {
  appStore.init()
})

onShow(() => {})

function goFootprint() {
  uni.navigateTo({ url: '/pages/spots/index' })
}

function goAllJournals() {
  uni.navigateTo({ url: '/pages/journals/index' })
}

function goBookDetail() {
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
    <!-- 状态栏占位 -->
    <view class="status-bar">
      <text class="time">9:41</text>
    </view>

    <!-- 标题区 -->
    <view class="header">
      <view class="header-top">
        <text class="title">途记</text>
        <view class="footprint-btn" @click="goFootprint">
          <text class="loc-icon">◎</text>
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
      <view class="china-map">
        <!-- 简化中国地图轮廓 + 城市点位 -->
        <view class="map-placeholder">
          <text class="map-shape">中国地图</text>
          <view
            v-for="c in cities"
            :key="c.name"
            class="city-dot"
            :class="c.status === 'visited' ? 'dot-green' : 'dot-orange'"
            :style="dotStyle(c)"
          >
            <text class="city-name">{{ c.name }}</text>
          </view>
        </view>
      </view>
      <view class="map-footer">
        <text class="lit-text">已点亮 {{ litCities }} 个城市</text>
        <text class="view-map" @click="goFootprint">查看地图 ›</text>
      </view>
    </view>

    <!-- 本次旅程 -->
    <view class="trip-card tj-card" @click="goBookDetail">
      <view class="trip-info">
        <text class="trip-label">本次旅程</text>
        <text class="trip-name">{{ currentBook.name }}</text>
        <text class="trip-date">{{ formatDate(currentBook.startTime) }} — {{ formatDate(currentBook.endTime) }}</text>
      </view>
      <view class="trip-divider" />
      <view class="trip-count">
        <text class="count-num">12</text>
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
        v-for="j in stories"
        :key="j.id"
        class="story-card tj-card"
        @click="goJournalDetail(j.id)"
      >
        <view class="story-thumb">
          <text class="thumb-placeholder">🏔️</text>
        </view>
        <view class="story-info">
          <text class="story-title">{{ j.title }}</text>
          <text class="story-loc">{{ j.locationName }}</text>
          <text class="story-excerpt">{{ j.content }}</text>
        </view>
        <text class="story-date">{{ formatDate(j.travelDate) }}</text>
      </view>
    </view>

    <TabBar active="home" @quick="onQuickRecord" />
  </view>
</template>

<style lang="scss" scoped>
.index-page {
  padding: 0 32rpx 160rpx;
}

.status-bar {
  height: 60rpx;
  display: flex;
  align-items: center;
  .time {
    font-weight: 700;
    font-size: 30rpx;
  }
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
  background: #ddede2;
  border-radius: 32rpx;
  padding: 28rpx;
  .map-title {
    font-size: 30rpx;
    font-weight: 700;
  }
  .china-map {
    margin-top: 16rpx;
    .map-placeholder {
      position: relative;
      height: 420rpx;
      background: #e6f0e8;
      border-radius: 24rpx;
      overflow: hidden;
      display: flex;
      align-items: center;
      justify-content: center;
      .map-shape {
        color: #b8c9be;
        font-size: 44rpx;
        letter-spacing: 8rpx;
      }
      .city-dot {
        position: absolute;
        width: 16rpx;
        height: 16rpx;
        border-radius: 50%;
        &.dot-green {
          background: #2e9e44;
        }
        &.dot-orange {
          background: #ff8a00;
        }
        .city-name {
          position: absolute;
          top: -28rpx;
          left: 50%;
          transform: translateX(-50%);
          font-size: 18rpx;
          color: #333;
          white-space: nowrap;
        }
      }
    }
  }
  .map-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-top: 20rpx;
    .lit-text {
      font-weight: 700;
      font-size: 28rpx;
    }
    .view-map {
      color: #2e9e6b;
      font-size: 26rpx;
    }
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
    .story-thumb {
      width: 120rpx;
      height: 120rpx;
      border-radius: 16rpx;
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
}
</style>
