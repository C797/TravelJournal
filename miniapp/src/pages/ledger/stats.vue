<script setup lang="ts">
import { ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import TabBar from '@/components/TabBar.vue'

const scope = ref<'week' | 'month' | 'year'>('month')

const categoryData = [
  { name: '餐饮', value: 42, color: '#1F4D3A' },
  { name: '住宿', value: 25, color: '#C77B4A' },
  { name: '交通', value: 18, color: '#9DB8A5' },
  { name: '其他', value: 15, color: '#DCE5DD' }
]

// 环形图 conic-gradient 构造
const conicGradient = (() => {
  let acc = 0
  const segs = categoryData.map((d) => {
    const start = acc
    acc += d.value
    return `${d.color} ${start}% ${acc}%`
  })
  return `conic-gradient(${segs.join(', ')})`
})()

// 折线图模拟数据点
const trendPoints = [30, 55, 40, 70, 52, 82, 60, 90, 65, 78, 48, 72, 58, 85, 50, 68, 42, 62, 55, 75, 60, 80, 52, 70, 58, 88, 66, 74, 54, 62]

onLoad(() => {})

function goBack() {
  uni.navigateBack()
}

function onQuick() {
  uni.navigateTo({ url: '/pages/ledger/record' })
}
</script>

<template>
  <view class="stats-page">
    <view class="tj-nav">
      <text class="tj-nav-back" @click="goBack">‹</text>
      <text class="tj-nav-title">账本统计</text>
      <text class="tj-nav-action">···</text>
    </view>

    <scroll-view scroll-y class="stats-scroll">
      <!-- 周期切换 -->
      <view class="scope-toggle">
        <view class="st-option" :class="{ active: scope === 'week' }" @click="scope = 'week'">周</view>
        <view class="st-option" :class="{ active: scope === 'month' }" @click="scope = 'month'">月</view>
        <view class="st-option" :class="{ active: scope === 'year' }" @click="scope = 'year'">年</view>
      </view>

      <!-- 总支出 -->
      <view class="total-card tj-card">
        <text class="total-period">2025年06月</text>
        <view class="total-value-row">
          <text class="total-num">¥8,560.00</text>
          <view class="total-ratio">
            <text class="ratio-arrow">↓</text>
            <text class="ratio-text">较上月 8.6%</text>
          </view>
        </view>
        <text class="total-label">总支出</text>
      </view>

      <!-- 支出分类 -->
      <view class="category-card tj-card">
        <view class="cc-header">
          <text class="cc-title">支出分类</text>
          <text class="cc-period">本月</text>
        </view>
        <view class="cc-content">
          <view class="ring-wrap">
            <view class="ring" :style="{ background: conicGradient }">
              <view class="ring-center">
                <text class="rc-num">¥8,560</text>
                <text class="rc-label">总支出</text>
              </view>
            </view>
          </view>
          <view class="legend-list">
            <view v-for="d in categoryData" :key="d.name" class="legend-item">
              <view class="legend-dot" :style="{ background: d.color }" />
              <text class="legend-name">{{ d.name }}</text>
              <text class="legend-value">{{ d.value }}%</text>
            </view>
          </view>
        </view>
      </view>

      <!-- 每日支出趋势 -->
      <view class="trend-card tj-card">
        <text class="trend-title">每日支出趋势</text>
        <view class="trend-chart">
          <svg viewBox="0 0 300 120" class="trend-svg">
            <polyline
              :points="trendPoints.map((p, i) => `${(i / 29) * 300},${110 - (p / 100) * 90}`).join(' ')"
              fill="none"
              stroke="#2E9E6B"
              stroke-width="2"
            />
            <line x1="0" y1="110" x2="300" y2="110" stroke="#ddd" stroke-width="1" stroke-dasharray="4" />
          </svg>
          <view class="trend-xaxis">
            <text v-for="d in ['01','05','10','15','20','25','30']" :key="d">{{ d }}</text>
          </view>
        </view>
      </view>

      <!-- 人均支出 -->
      <view class="avg-card">
        <view class="avg-info">
          <text class="avg-label">本月人均支出</text>
          <text class="avg-num">¥2,140.00</text>
        </view>
        <text class="avg-members">3 位成员</text>
      </view>
    </scroll-view>

    <TabBar active="ledger" @quick="onQuick" />
  </view>
</template>

<style lang="scss" scoped>
.stats-page {
  min-height: 100vh;
  background: #f0f2ef;
  display: flex;
  flex-direction: column;
}
.stats-scroll { flex: 1; padding: 0 32rpx; padding-bottom: 160rpx; }

.scope-toggle {
  display: flex;
  background: #fff;
  border-radius: 999rpx;
  padding: 6rpx;
  margin-top: 16rpx;
  .st-option {
    flex: 1;
    height: 68rpx;
    border-radius: 999rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 28rpx;
    color: #999;
    &.active { background: #34a853; color: #fff; font-weight: 600; }
  }
}

.total-card {
  margin-top: 24rpx;
  padding: 32rpx;
  .total-period { font-size: 24rpx; color: #999; }
  .total-value-row {
    margin-top: 8rpx;
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    .total-num { font-size: 56rpx; font-weight: 800; }
    .total-ratio {
      display: flex;
      align-items: center;
      gap: 6rpx;
      .ratio-arrow, .ratio-text { color: #2e9e6b; font-size: 24rpx; }
    }
  }
  .total-label { font-size: 22rpx; color: #999; }
}

.category-card {
  margin-top: 24rpx;
  padding: 28rpx;
  .cc-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    .cc-title { font-size: 30rpx; font-weight: 700; }
    .cc-period { font-size: 22rpx; color: #999; }
  }
  .cc-content {
    margin-top: 24rpx;
    display: flex;
    align-items: center;
    gap: 40rpx;
    .ring-wrap {
      flex-shrink: 0;
      .ring {
        width: 240rpx;
        height: 240rpx;
        border-radius: 50%;
        position: relative;
        .ring-center {
          position: absolute;
          inset: 44rpx;
          background: #fff;
          border-radius: 50%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          .rc-num { font-size: 32rpx; font-weight: 700; }
          .rc-label { font-size: 20rpx; color: #999; }
        }
      }
    }
    .legend-list {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 20rpx;
      .legend-item {
        display: flex;
        align-items: center;
        gap: 12rpx;
        .legend-dot { width: 20rpx; height: 20rpx; border-radius: 50%; }
        .legend-name { font-size: 24rpx; color: #555; }
        .legend-value { margin-left: auto; font-size: 26rpx; font-weight: 700; }
      }
    }
  }
}

.trend-card {
  margin-top: 24rpx;
  padding: 28rpx;
  .trend-title { font-size: 30rpx; font-weight: 700; }
  .trend-chart {
    margin-top: 24rpx;
    .trend-svg { width: 100%; height: 240rpx; }
    .trend-xaxis {
      display: flex;
      justify-content: space-between;
      font-size: 20rpx;
      color: #999;
      padding: 0 8rpx;
    }
  }
}

.avg-card {
  margin-top: 24rpx;
  background: #dff0e4;
  border-radius: 20rpx;
  padding: 28rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
  .avg-info {
    display: flex;
    flex-direction: column;
    gap: 6rpx;
    .avg-label { font-size: 24rpx; color: #999; }
    .avg-num { font-size: 40rpx; font-weight: 700; }
  }
  .avg-members { font-size: 24rpx; color: #999; }
}
</style>
