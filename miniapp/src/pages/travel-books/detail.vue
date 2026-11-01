<script setup lang="ts">
import { ref, computed } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import TabBar from '@/components/TabBar.vue'
import { mockTravelBooks, mockJournals, mockBills, mockLedger } from '@/mock'
import { formatDate } from '@/utils'
import type { Bill } from '@/types'

const catMap: Record<string, { icon: string; cls: string }> = {
  餐饮: { icon: '🍲', cls: 'food' },
  交通: { icon: '✈️', cls: 'transport' },
  住宿: { icon: '🏠', cls: 'hotel' },
  门票: { icon: '🎫', cls: 'ticket' },
  购物: { icon: '🛍️', cls: 'shop' },
  其他: { icon: '☕', cls: 'other' }
}
function billCatIcon(c: string) {
  return catMap[c]?.icon || '💵'
}
function billCatClass(c: string) {
  return catMap[c]?.cls || 'other'
}

const activeTab = ref<'journal' | 'ledger'>('journal')
const book = ref(mockTravelBooks[0])
const journals = ref(mockJournals)
const bills = ref(mockBills)
const ledger = ref(mockLedger)

onLoad((query: any) => {
  if (query?.id) {
    const found = mockTravelBooks.find((b) => b.id === query.id)
    if (found) book.value = found
  }
})

function goBack() {
  uni.navigateBack()
}

function goJournal(id: string) {
  uni.navigateTo({ url: `/pages/journals/detail?id=${id}` })
}

function goSpots() {
  uni.navigateTo({ url: `/pages/spots/index?bookId=${book.value.id}` })
}

function onQuick() {
  uni.navigateTo({ url: '/pages/journals/edit' })
}

// 按日期分组账单
const groupedBills = computed(() => {
  const groups: { date: string; label: string; items: Bill[] }[] = []
  const map = new Map<string, Bill[]>()
  bills.value.forEach((b) => {
    const key = b.billDate
    if (!map.has(key)) map.set(key, [])
    map.get(key)!.push(b)
  })
  map.forEach((items, date) => groups.push({ date, label: formatDate(date), items }))
  return groups
})
</script>

<template>
  <view class="detail-page">
    <scroll-view scroll-y class="detail-scroll">
      <!-- 封面 -->
      <view class="cover">
        <text class="cover-emoji">🏔️</text>
        <view class="cover-nav">
          <view class="cover-btn" @click="goBack"><text>‹</text></view>
          <view class="cover-btn"><text>···</text></view>
        </view>
        <view class="cover-info">
          <text class="ci-tag">TRIP JOURNAL / 01</text>
          <text class="ci-name">{{ book.name }}</text>
          <text class="ci-meta">{{ formatDate(book.startTime) }} — {{ formatDate(book.endTime) }} · {{ book.tripDays }} 天</text>
        </view>
      </view>

      <!-- 统计框 -->
      <view class="stats-card tj-card">
        <view class="stat-item">
          <text class="stat-num">12</text>
          <text class="stat-label">篇旅记</text>
        </view>
        <view class="stat-divider" />
        <view class="stat-item">
          <text class="stat-num">06</text>
          <text class="stat-label">个地点</text>
        </view>
        <view class="stat-divider" />
        <view class="stat-item">
          <text class="stat-num">{{ book.tripDays }}</text>
          <text class="stat-label">旅行天数</text>
        </view>
      </view>

      <!-- Tab 切换 -->
      <view class="tabs">
        <view class="tab" :class="{ active: activeTab === 'journal' }" @click="activeTab = 'journal'">旅记</view>
        <view class="tab" :class="{ active: activeTab === 'ledger' }" @click="activeTab = 'ledger'">账本</view>
      </view>

      <!-- 旅记 Tab -->
      <view v-if="activeTab === 'journal'" class="tab-content">
        <view class="list-header">
          <text class="lh-title">全部旅记 <text class="lh-count">12</text></text>
          <text class="lh-action">按时间 ›</text>
        </view>
        <view
          v-for="j in journals"
          :key="j.id"
          class="journal-card tj-card"
          @click="goJournal(j.id)"
        >
          <view class="jc-thumb"><text>🏔️</text></view>
          <view class="jc-info">
            <text class="jc-title">{{ j.title }}</text>
            <text class="jc-meta">{{ formatDate(j.travelDate) }} · {{ j.locationName }}</text>
            <text class="jc-excerpt">{{ j.content }}</text>
          </view>
        </view>
      </view>

      <!-- 账本 Tab -->
      <view v-else class="tab-content">
        <view class="ledger-stats tj-card">
          <view class="ls-item">
            <text class="ls-num">¥4,268</text>
            <text class="ls-label">总支出</text>
          </view>
          <view class="ls-divider" />
          <view class="ls-item">
            <text class="ls-num">¥1,067</text>
            <text class="ls-label">人均花费</text>
          </view>
          <view class="ls-divider" />
          <view class="ls-item">
            <text class="ls-num">32</text>
            <text class="ls-label">记账笔数</text>
          </view>
        </view>

        <view class="list-header">
          <text class="lh-title">账单明细 <text class="lh-count green">32</text></text>
          <text class="lh-action">按日期 ›</text>
        </view>

        <view v-for="g in groupedBills" :key="g.date" class="bill-group">
          <text class="bg-date">{{ g.label }}</text>
          <view v-for="b in g.items" :key="b.id" class="bill-card tj-card">
            <view class="bc-icon" :class="'cat-' + billCatClass(b.category)"><text>{{ billCatIcon(b.category) }}</text></view>
            <view class="bc-info">
              <text class="bc-title">{{ b.category }} · {{ b.subCategory }}</text>
              <text class="bc-remark">{{ b.remark }}</text>
            </view>
            <text class="bc-amount" :class="{ income: b.billType === 'income' }">
              {{ b.billType === 'income' ? '+' : '-' }}¥{{ b.amount.toFixed(2) }}
            </text>
          </view>
        </view>
      </view>
    </scroll-view>

    <TabBar active="books" @quick="onQuick" />
  </view>
</template>

<style lang="scss" scoped>
.detail-page { min-height: 100vh; background: #f5f6f5; }
.detail-scroll { height: 100vh; }

.cover {
  position: relative;
  height: 560rpx;
  background: linear-gradient(160deg, #8aa89a, #3e6a54);
  display: flex;
  align-items: center;
  justify-content: center;
  .cover-emoji { font-size: 140rpx; }
  .cover-nav {
    position: absolute;
    top: 60rpx;
    left: 0;
    right: 0;
    padding: 0 32rpx;
    display: flex;
    justify-content: space-between;
    .cover-btn {
      width: 72rpx;
      height: 72rpx;
      border-radius: 50%;
      background: rgba(255,255,255,0.3);
      color: #fff;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 40rpx;
    }
  }
  .cover-info {
    position: absolute;
    left: 0;
    right: 0;
    bottom: 0;
    padding: 40rpx 32rpx;
    display: flex;
    flex-direction: column;
    gap: 8rpx;
    .ci-tag { font-size: 22rpx; color: rgba(255,255,255,0.85); letter-spacing: 3rpx; }
    .ci-name { font-size: 52rpx; font-weight: 700; color: #fff; }
    .ci-meta { font-size: 24rpx; color: rgba(255,255,255,0.9); }
  }
}

.stats-card {
  margin: -40rpx 32rpx 0;
  position: relative;
  display: flex;
  align-items: center;
  padding: 32rpx 0;
  border-radius: 32rpx;
  box-shadow: 0 4rpx 20rpx rgba(0,0,0,0.05);
  .stat-item {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6rpx;
    .stat-num { font-size: 44rpx; font-weight: 700; }
    .stat-label { font-size: 22rpx; color: #999; }
  }
  .stat-divider { width: 1rpx; height: 60rpx; background: #eee; }
}

.tabs {
  display: flex;
  gap: 16rpx;
  margin: 32rpx 32rpx 0;
  .tab {
    flex: 1;
    height: 72rpx;
    border-radius: 999rpx;
    background: #fff;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 28rpx;
    &.active {
      background: #2e9e6b;
      color: #fff;
      font-weight: 600;
    }
  }
}

.tab-content {
  padding: 24rpx 32rpx 160rpx;
}
.list-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: 16rpx 0;
  .lh-title { font-size: 30rpx; font-weight: 700; .lh-count { color: #999; font-size: 24rpx; } .lh-count.green { color: #2e9e6b; } }
  .lh-action { font-size: 24rpx; color: #999; }
}

.journal-card {
  display: flex;
  padding: 24rpx;
  margin-bottom: 16rpx;
  .jc-thumb {
    width: 140rpx;
    height: 140rpx;
    border-radius: 16rpx;
    background: #e8f3ec;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 56rpx;
    flex-shrink: 0;
  }
  .jc-info {
    flex: 1;
    margin-left: 24rpx;
    display: flex;
    flex-direction: column;
    gap: 6rpx;
    .jc-title { font-size: 28rpx; font-weight: 700; }
    .jc-meta { font-size: 22rpx; color: #999; }
    .jc-excerpt { font-size: 22rpx; color: #999; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
  }
}

.ledger-stats {
  display: flex;
  align-items: center;
  padding: 32rpx 0;
  .ls-item {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6rpx;
    .ls-num { font-size: 40rpx; font-weight: 700; }
    .ls-label { font-size: 22rpx; color: #999; }
  }
  .ls-divider { width: 1rpx; height: 60rpx; background: #eee; }
}

.bill-group {
  margin-bottom: 16rpx;
  .bg-date { font-size: 22rpx; color: #999; display: block; margin: 16rpx 8rpx 12rpx; }
}
.bill-card {
  display: flex;
  align-items: center;
  padding: 24rpx;
  margin-bottom: 12rpx;
  .bc-icon {
    width: 72rpx;
    height: 72rpx;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 36rpx;
    flex-shrink: 0;
    &.cat-food { background: #fff3e0; }
    &.cat-transport { background: #e3f0ff; }
    &.cat-hotel { background: #fde8ee; }
    &.cat-ticket { background: #fff8e0; }
    &.cat-shop { background: #e8f3ec; }
    &.cat-other { background: #efe9ff; }
  }
  .bc-info {
    flex: 1;
    margin-left: 20rpx;
    display: flex;
    flex-direction: column;
    gap: 4rpx;
    .bc-title { font-size: 28rpx; font-weight: 600; }
    .bc-remark { font-size: 22rpx; color: #999; }
  }
  .bc-amount { font-size: 30rpx; font-weight: 700; &.income { color: #2e9e6b; } }
}
</style>
