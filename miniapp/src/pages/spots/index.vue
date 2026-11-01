<script setup lang="ts">
import { ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { mockSpots } from '@/mock'
import type { MapSpot } from '@/types'

const spots = ref<MapSpot[]>(mockSpots)
const showSpotPopup = ref(false)
const activeSpot = ref<MapSpot | null>(null)
const showAddPopup = ref(false)

onLoad((query: any) => {})

function goBack() {
  uni.navigateBack()
}

function onSpotClick(s: MapSpot) {
  activeSpot.value = s
  showSpotPopup.value = true
}

function addSpot(status: 'visited' | 'planned') {
  showAddPopup.value = false
  uni.showToast({ title: status === 'visited' ? '已添加：已到访' : '已添加：规划中', icon: 'none' })
}
</script>

<template>
  <view class="spots-page">
    <view class="tj-nav">
      <text class="tj-nav-back" @click="goBack">‹</text>
      <text class="tj-nav-title">标注点管理</text>
    </view>

    <scroll-view scroll-y class="spots-scroll">
      <!-- 地图卡片 -->
      <view class="map-card">
        <view class="map-header">
          <text class="map-title">中国足迹地图</text>
          <view class="legend">
            <view class="legend-item"><view class="dot dot-green" /><text>已到访</text></view>
            <view class="legend-item"><view class="dot dot-orange" /><text>规划中</text></view>
          </view>
        </view>
        <view class="map-placeholder">
          <text class="map-shape">中国地图</text>
          <view
            v-for="s in spots"
            :key="s.id"
            class="spot-dot"
            :class="s.markStatus === 'visited' ? 'dot-green' : 'dot-orange'"
            @click="onSpotClick(s)"
          >
            <text class="spot-name">{{ s.locationName }}</text>
          </view>
        </view>
      </view>

      <!-- 已添加地点列表 -->
      <view class="list-header">
        <text class="lh-title">已添加地点</text>
        <text class="lh-count">共 {{ spots.length }} 个</text>
      </view>
      <view class="spot-list tj-card">
        <view v-for="(s, i) in spots" :key="s.id" class="spot-item">
          <view class="si-info">
            <text class="si-name">{{ s.locationName }}</text>
            <text class="si-meta" v-if="s.journalCount">{{ s.journalCount }} 篇游记</text>
          </view>
          <text class="tj-tag" :class="s.markStatus === 'visited' ? 'tag-green' : 'tag-orange'">
            {{ s.markStatus === 'visited' ? '已到访' : '规划中' }}
          </text>
          <view v-if="i < spots.length - 1" class="si-divider" />
        </view>
      </view>
    </scroll-view>

    <view class="add-btn" @click="showAddPopup = true">＋ 添加标注点</view>

    <!-- 点位弹窗 -->
    <view v-if="showSpotPopup" class="popup-mask" @click="showSpotPopup = false">
      <view class="popup" @click.stop>
        <text class="popup-title">{{ activeSpot?.locationName }}</text>
        <text class="popup-meta">{{ activeSpot?.visitDate }} · {{ activeSpot?.journalCount || 0 }}篇游记</text>
        <view class="popup-action" @click="showSpotPopup = false">查看详情 →</view>
      </view>
    </view>

    <!-- 添加弹窗 -->
    <view v-if="showAddPopup" class="popup-mask" @click="showAddPopup = false">
      <view class="popup" @click.stop>
        <text class="popup-title">选择标注点状态</text>
        <view class="add-options">
          <view class="add-opt" @click="addSpot('visited')">
            <view class="dot dot-green" /><text>已到访</text>
          </view>
          <view class="add-opt" @click="addSpot('planned')">
            <view class="dot dot-orange" /><text>规划中</text>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.spots-page {
  min-height: 100vh;
  background: #f5f5f7;
  display: flex;
  flex-direction: column;
}
.spots-scroll {
  flex: 1;
  padding: 0 32rpx;
  padding-bottom: 160rpx;
}

.map-card {
  background: #e8f0ea;
  border-radius: 32rpx;
  padding: 24rpx;
  .map-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    .map-title { font-size: 26rpx; color: #3d5a4c; }
    .legend {
      display: flex;
      gap: 20rpx;
      .legend-item {
        display: flex;
        align-items: center;
        gap: 8rpx;
        font-size: 22rpx;
        color: #3d5a4c;
      }
    }
  }
  .map-placeholder {
    position: relative;
    margin-top: 16rpx;
    height: 420rpx;
    background: #dde8e0;
    border-radius: 20rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    .map-shape { color: #a8b8ae; font-size: 40rpx; letter-spacing: 6rpx; }
    .spot-dot {
      position: absolute;
      width: 20rpx;
      height: 20rpx;
      border-radius: 50%;
      &.dot-green { background: #3d9970; }
      &.dot-orange { background: #e8853d; }
      .spot-name {
        position: absolute;
        top: -30rpx;
        left: 50%;
        transform: translateX(-50%);
        font-size: 18rpx;
        color: #333;
        white-space: nowrap;
      }
    }
  }
}

.list-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: 32rpx 0 16rpx;
  .lh-title { font-size: 32rpx; font-weight: 700; }
  .lh-count { font-size: 24rpx; color: #999; }
}

.spot-list {
  padding: 0 28rpx;
  .spot-item {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 28rpx 0;
    .si-info {
      display: flex;
      flex-direction: column;
      gap: 4rpx;
      .si-name { font-size: 28rpx; font-weight: 700; }
      .si-meta { font-size: 22rpx; color: #999; }
    }
    .si-divider {
      position: absolute;
      left: 0;
      right: 0;
      bottom: 0;
      height: 1rpx;
      background: #f0f0f0;
    }
  }
}

.add-btn {
  position: fixed;
  left: 32rpx;
  right: 32rpx;
  bottom: 40rpx;
  height: 96rpx;
  border-radius: 48rpx;
  background: #3d9970;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32rpx;
  font-weight: 600;
}

.popup-mask {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 200;
  .popup {
    width: 560rpx;
    background: #fff;
    border-radius: 24rpx;
    padding: 40rpx;
    display: flex;
    flex-direction: column;
    gap: 16rpx;
    .popup-title { font-size: 32rpx; font-weight: 700; }
    .popup-meta { font-size: 24rpx; color: #999; }
    .popup-action { font-size: 26rpx; color: #3d9970; margin-top: 8rpx; }
    .add-options {
      display: flex;
      gap: 24rpx;
      margin-top: 8rpx;
      .add-opt {
        flex: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 12rpx;
        padding: 24rpx;
        border-radius: 16rpx;
        background: #f5f7f5;
        font-size: 28rpx;
      }
    }
  }
}

.dot { width: 16rpx; height: 16rpx; border-radius: 50%; }
.dot-green { background: #3d9970; }
.dot-orange { background: #e8853d; }
</style>
