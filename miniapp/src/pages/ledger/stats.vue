<script setup lang="ts">
import { computed, ref } from 'vue'
import { onLoad, onShow } from '@dcloudio/uni-app'
import TabBar from '@/components/TabBar.vue'
import Icon from '@/components/Icon.vue'
import LineChart from '@/components/LineChart.vue'
import { statusBarStyle, navRightStyle } from '@/utils/safe-area'
import { formatNumber } from '@/utils'
import { ledgerApi } from '@/api'
import { useLedgerStore } from '@/stores/ledger'
import type { LedgerStats } from '@/types'

const ledgerStore = useLedgerStore()

const scope = ref<'week' | 'month' | 'year'>('month')
const ledgerId = ref('')
const stats = ref<LedgerStats | null>(null)
const loading = ref(false)

/** 分类配色：主色 → 暖色 → 浅绿 → 中性，按占比从高到低取 */
const PALETTE = ['#1F4D3A', '#C77B4A', '#2E9E6B', '#9DB8A5', '#D9B382', '#C4CFC6']

const categoryData = computed(() => {
  const list = stats.value?.categoryRatio || []
  if (!list.length) return [{ name: '暂无支出', value: 100, color: '#DCE5DD' }]
  return list.map((d, i) => ({
    name: d.name,
    value: d.value,
    color: PALETTE[i % PALETTE.length]
  }))
})

const ringGradient = computed(() => {
  let acc = 0
  const segs = categoryData.value.map((d) => {
    const start = acc
    acc += d.value || 0
    return `${d.color} ${start}% ${acc}%`
  })
  // 百分比合计不足 100 时补底色，避免环缺口
  if (acc < 100) segs.push(`#EEF2EE ${acc}% 100%`)
  return `conic-gradient(${segs.join(', ')})`
})

/** 每日支出趋势（无数据时给一条平稳基线，避免图表除零） */
const trend = computed(() => {
  const list = stats.value?.dailyTrend || []
  if (list.length >= 2) return list.map((d) => d.value)
  if (list.length === 1) return [0, list[0].value]
  return [0, 0]
})

/** 横轴刻度：取趋势里的首/中/尾日期 */
const axisLabels = computed(() => {
  const list = stats.value?.dailyTrend || []
  if (!list.length) return ['01', '05', '10', '15', '20', '25', '30']
  const day = (d: string) => d.slice(8, 10)
  if (list.length <= 4) return list.map((d) => day(d.date))
  const idx = [0, Math.floor(list.length * 0.25), Math.floor(list.length * 0.5), Math.floor(list.length * 0.75), list.length - 1]
  return Array.from(new Set(idx)).map((i) => day(list[i].date))
})

const periodLabel = computed(() => {
  const now = new Date()
  const y = now.getFullYear()
  if (scope.value === 'year') return `${y}年`
  if (scope.value === 'week') {
    const d = new Date(y, now.getMonth(), now.getDate())
    const day = d.getDay() || 7
    d.setDate(d.getDate() - day + 1)
    const first = new Date(y, 0, 1)
    const week = Math.ceil(((d.getTime() - first.getTime()) / 86400000 + first.getDay() + 1) / 7)
    return `${y}年第${week}周`
  }
  return `${y}年${String(now.getMonth() + 1).padStart(2, '0')}月`
})

const ratioLabel = computed(
  () => ({ week: '较上周', month: '较上月', year: '较上年' })[scope.value]
)

const ratio = computed(() => stats.value?.prevPeriodRatio ?? null)
/** 支出上涨用暖色提示，下降用绿色 */
const ratioUp = computed(() => (ratio.value ?? 0) > 0)

const periodNote = computed(
  () => ({ week: '本周', month: '本月', year: '本年' })[scope.value]
)

function money(n: number, digits = 2) {
  return formatNumber(n || 0, digits)
}

/** 环中心金额：取整到元，避免圆环中心溢出 */
const totalInt = computed(() => formatNumber(Math.round(stats.value?.totalExpense || 0), 0))

async function loadStats() {
  if (!ledgerId.value) {
    await ledgerStore.load()
    ledgerId.value = ledgerStore.current?.id || ''
  }
  if (!ledgerId.value) return
  loading.value = true
  try {
    stats.value = await ledgerApi.stats(ledgerId.value, scope.value)
  } catch {
    // 静默：request 层已提示
  } finally {
    loading.value = false
  }
}

onLoad((query) => {
  ledgerId.value = (query?.ledgerId as string) || ledgerStore.current?.id || ''
})

onShow(() => {
  loadStats()
})

function switchScope(s: 'week' | 'month' | 'year') {
  if (scope.value === s) return
  scope.value = s
  loadStats()
}

function goBack() {
  uni.navigateBack()
}

function onQuick() {
  uni.navigateTo({ url: '/pages/ledger/record' })
}
</script>

<template>
  <view class="stats-page">
    <view class="status-bar" :style="statusBarStyle" />

    <!-- 导航 -->
    <view class="nav" :style="navRightStyle">
      <view class="nav-back" @click="goBack">
        <Icon name="chevron-left" color="#1A2E2A" size="40rpx" />
      </view>
      <text class="nav-title">账本统计</text>
      <view class="nav-more">
        <text class="nav-more-dot">···</text>
      </view>
    </view>

    <scroll-view scroll-y class="scroll">
      <!-- 周期切换 -->
      <view class="toggle">
        <view class="toggle-item" :class="{ active: scope === 'week' }" @click="switchScope('week')">周</view>
        <view class="toggle-item" :class="{ active: scope === 'month' }" @click="switchScope('month')">月</view>
        <view class="toggle-item" :class="{ active: scope === 'year' }" @click="switchScope('year')">年</view>
      </view>

      <!-- 总支出 -->
      <view class="total">
        <text class="total-period">{{ periodLabel }}</text>
        <view class="total-row">
          <view class="total-value">
            <text class="total-symbol">¥</text>
            <text class="total-num">{{ money(stats?.totalExpense || 0) }}</text>
          </view>
          <view v-if="ratio !== null" class="total-ratio">
            <text class="ratio-label">{{ ratioLabel }}</text>
            <view :class="['ratio-icon', ratioUp ? 'up' : 'down']">
              <Icon
                :name="ratioUp ? 'arrow-up' : 'arrow-down'"
                :color="ratioUp ? '#C0563F' : '#2E9E6B'"
                size="22rpx"
              />
            </view>
            <text class="ratio-num" :class="{ up: ratioUp }">{{ Math.abs(ratio).toFixed(1) }}%</text>
          </view>
          <view v-else class="total-ratio">
            <text class="ratio-label">{{ ratioLabel }}</text>
            <text class="ratio-num muted">—</text>
          </view>
        </view>
        <text class="total-label">总支出</text>
      </view>

      <!-- 支出分类 -->
      <view class="card">
        <view class="card-head">
          <text class="card-title">支出分类</text>
          <text class="card-note">{{ periodNote }}</text>
        </view>
        <view class="ring-row">
          <view class="ring" :style="{ background: ringGradient }">
            <view class="ring-center">
              <text class="rc-num">¥{{ totalInt }}</text>
              <text class="rc-label">总支出</text>
            </view>
          </view>
          <view class="legend">
            <view v-for="d in categoryData" :key="d.name" class="legend-item">
              <view class="legend-dot" :style="{ background: d.color }" />
              <text class="legend-name">{{ d.name }}</text>
              <text class="legend-value">{{ d.value }}%</text>
            </view>
          </view>
        </view>
      </view>

      <!-- 每日支出趋势 -->
      <view class="card">
        <text class="card-title">每日支出趋势</text>
        <view class="trend">
          <LineChart :values="trend" height="172rpx" :dot-step="1" />
          <view class="trend-axis">
            <text v-for="(d, i) in axisLabels" :key="`${d}-${i}`">{{ d }}</text>
          </view>
        </view>
      </view>

      <!-- 人均支出 -->
      <view class="avg">
        <view class="avg-info">
          <text class="avg-label">{{ periodNote }}人均支出</text>
          <text class="avg-num">¥{{ money(stats?.avgExpense || 0) }}</text>
        </view>
        <text class="avg-members">{{ stats?.memberCount || 0 }} 位成员</text>
      </view>

      <view class="bottom-space" />
    </scroll-view>

    <TabBar active="ledger" @quick="onQuick" />
  </view>
</template>

<style lang="scss" scoped>
/* 高度由 utils/safe-area.ts 按机型注入 */
.status-bar {
  width: 100%;
}

.stats-page {
  min-height: 100vh;
  background: #f5f7f5;
  display: flex;
  flex-direction: column;
}

/* 导航 */
.nav {
  display: flex;
  align-items: center;
  height: 104rpx;
  padding: 0 32rpx;
  flex-shrink: 0;
  .nav-back {
    width: 48rpx;
    height: 64rpx;
    display: flex;
    align-items: center;
  }
  .ico { width: 40rpx; height: 40rpx; }
  .nav-title {
    font-size: 34rpx;
    font-weight: 600;
    color: #1a2e2a;
    letter-spacing: 0.4rpx;
  }
  .nav-more {
    margin-left: auto;
    width: 112rpx;
    height: 64rpx;
    border-radius: 32rpx;
    background: #fff;
    display: flex;
    align-items: center;
    justify-content: center;
    .nav-more-dot {
      font-size: 28rpx;
      color: #4a5752;
      letter-spacing: 2rpx;
      line-height: 1;
    }
  }
}

.scroll {
  flex: 1;
  padding: 0 32rpx;
  padding-bottom: calc(240rpx + env(safe-area-inset-bottom));
}

.card {
  background: #fff;
  border-radius: 32rpx;
  padding: 36rpx 40rpx;
  margin-top: 28rpx;
}

.card-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.card-title {
  font-size: 28rpx;
  font-weight: 600;
  color: #1a2e2a;
}

.card-note {
  font-size: 22rpx;
  color: #b0b8b2;
}

/* 周期切换 */
.toggle {
  display: flex;
  height: 96rpx;
  padding: 6rpx;
  background: #fff;
  border-radius: 48rpx;
  margin-top: 12rpx;
  .toggle-item {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 42rpx;
    font-size: 28rpx;
    color: #6b756f;
    &.active {
      background: #2e9e6b;
      color: #fff;
      font-weight: 600;
    }
  }
}

/* 总支出 */
.total {
  padding: 26rpx 8rpx 4rpx;
  .total-period {
    font-size: 22rpx;
    color: #9aa39d;
  }
  .total-row {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    margin-top: 6rpx;
  }
  .total-value {
    display: flex;
    align-items: flex-end;
    gap: 4rpx;
  }
  .total-symbol {
    font-size: 44rpx;
    color: #1a2e2a;
    font-weight: 500;
    line-height: 1.2;
    padding-bottom: 8rpx;
  }
  .total-num {
    font-size: 88rpx;
    font-weight: 700;
    color: #1a2e2a;
    line-height: 1;
    letter-spacing: -1.5rpx;
  }
  .total-ratio {
    display: flex;
    align-items: center;
    gap: 4rpx;
    padding-bottom: 12rpx;
  }
  .ratio-label {
    font-size: 22rpx;
    color: #9aa39d;
  }
  .ratio-arrow {
    width: 22rpx;
    height: 22rpx;
  }
  .ratio-num {
    font-size: 24rpx;
    font-weight: 600;
    color: #2e9e6b;
    &.up {
      color: #c0563f;
    }
    &.muted {
      color: #b0b8b2;
      font-weight: 500;
    }
  }
  .ratio-icon {
    width: 22rpx;
    height: 22rpx;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .total-label {
    display: block;
    margin-top: 10rpx;
    font-size: 22rpx;
    color: #9aa39d;
  }
}

/* 环形 + 图例 */
.ring-row {
  display: flex;
  align-items: center;
  gap: 36rpx;
  margin-top: 26rpx;
  .ring {
    width: 240rpx;
    height: 240rpx;
    border-radius: 50%;
    flex-shrink: 0;
    position: relative;
  }
  .ring-center {
    position: absolute;
    inset: 40rpx;
    background: #fff;
    border-radius: 50%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 2rpx;
  }
  .rc-num {
    font-size: 30rpx;
    font-weight: 700;
    color: #1a2e2a;
    line-height: 1.1;
  }
  .rc-label {
    font-size: 20rpx;
    color: #9aa39d;
  }
  .legend {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 22rpx;
  }
  .legend-item {
    display: flex;
    align-items: center;
    gap: 10rpx;
  }
  .legend-dot {
    width: 12rpx;
    height: 12rpx;
    border-radius: 50%;
    flex-shrink: 0;
  }
  .legend-name {
    font-size: 24rpx;
    color: #4a5752;
  }
  .legend-value {
    margin-left: auto;
    font-size: 26rpx;
    font-weight: 700;
    color: #1a2e2a;
  }
}

/* 趋势图 */
.trend {
  margin-top: 24rpx;
  .trend-svg {
    width: 100%;
    height: 172rpx;
    display: block;
  }
  .trend-axis {
    display: flex;
    justify-content: space-between;
    margin-top: 8rpx;
    font-size: 20rpx;
    color: #b0b8b2;
  }
}

/* 人均 */
.avg {
  margin-top: 28rpx;
  background: #eaf3ec;
  border-radius: 32rpx;
  padding: 28rpx 36rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
  .avg-info {
    display: flex;
    flex-direction: column;
    gap: 6rpx;
  }
  .avg-label {
    font-size: 22rpx;
    color: #6b756f;
  }
  .avg-num {
    font-size: 36rpx;
    font-weight: 700;
    color: #1a2e2a;
    letter-spacing: -0.4rpx;
  }
  .avg-members {
    font-size: 22rpx;
    color: #9aa39d;
  }
}

.bottom-space {
  height: 40rpx;
}
</style>
