<script setup lang="ts">
import { ref, computed } from 'vue'
import { onLoad, onShow } from '@dcloudio/uni-app'
import TabBar from '@/components/TabBar.vue'
import { bookApi, journalApi } from '@/api/book'
import { ledgerApi, billApi } from '@/api/ledger'
import { formatDate, formatMoneyInt, formatMoney } from '@/utils'
import Icon from '@/components/Icon.vue'
import type { Bill, TravelBook, Journal, Ledger } from '@/types'
import { overlayNavStyle } from '@/utils/safe-area'

// 与记账页同一套分类图标
const catMap: Record<string, { icon: string; cls: string }> = {
  餐饮: { icon: 'bowl', cls: 'food' },
  交通: { icon: 'send', cls: 'transport' },
  住宿: { icon: 'house', cls: 'hotel' },
  门票: { icon: 'triangle', cls: 'ticket' },
  购物: { icon: 'bag', cls: 'shop' },
  其他: { icon: 'dots', cls: 'other' }
}
function billCatIcon(c: string) {
  return catMap[c]?.icon || 'dots'
}
function billCatClass(c: string) {
  return catMap[c]?.cls || 'other'
}

// 封面与缩略图取自设计稿导出（static/photos）
const THUMBS = [
  '/static/photos/journal-1.jpg',
  '/static/photos/journal-2.jpg',
  '/static/photos/journal-3.jpg',
  '/static/photos/journal-4.jpg'
]
/** 游记缩略图：优先首图，无图用本地占位 */
function thumbOf(i: number, j?: Journal) {
  const first = j?.images && j.images.length ? j.images[0].url : ''
  return first || THUMBS[i % THUMBS.length]
}

const activeTab = ref<'journal' | 'ledger'>('journal')
const bookId = ref('')

// 用占位对象初始化，避免模板中 book.xxx 在加载完成前报错
const book = ref<TravelBook>({
  id: '',
  name: '',
  startTime: '',
  endTime: '',
  bookIsPublic: false,
  ownerId: '',
  tripDays: 0,
  journalCount: 0,
  spotCount: 0
})
const journals = ref<Journal[]>([])
const bills = ref<Bill[]>([])
const ledger = ref<Ledger | null>(null)
const loading = ref(true)

const coverUrl = computed(() => book.value.coverUrl || '/static/photos/book-chuanxi.jpg')

async function loadData() {
  if (!bookId.value) return
  loading.value = true
  try {
    book.value = await bookApi.detail(bookId.value)

    const [journalPage, ledgerInfo] = await Promise.all([
      journalApi.listByBook(bookId.value, 1, 50).catch(() => ({ list: [], total: 0 })),
      ledgerApi.getByBook(bookId.value).catch(() => null)
    ])
    journals.value = journalPage.list
    ledger.value = ledgerInfo

    if (ledgerInfo) {
      const billPage = await billApi.list(ledgerInfo.id, 1, 100).catch(() => ({ list: [] }))
      bills.value = billPage.list
    }
  } catch {
    // 详情加载失败时保留空态
  } finally {
    loading.value = false
  }
}

onLoad((query: any) => {
  bookId.value = query?.id || ''
  loadData()
})

onShow(() => {
  if (bookId.value && !loading.value) loadData()
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
  uni.navigateTo({ url: `/pages/journals/edit?bookId=${bookId.value}` })
}

// 按日期分组账单
const groupedBills = computed(() => {
  const groups: { date: string; label: string; items: Bill[] }[] = []
  const map = new Map<string, Bill[]>()
  bills.value.forEach((b) => {
    const key = String(b.billDate).slice(0, 10)
    if (!map.has(key)) map.set(key, [])
    map.get(key)!.push(b)
  })
  map.forEach((items, date) => groups.push({ date, label: formatDate(date), items }))
  return groups
})

/** 账本统计：总支出 / 人均 / 笔数 */
const ledgerSummary = computed(() => ({
  totalExpense: ledger.value?.totalExpense || 0,
  avgExpense: ledger.value?.avgExpense || 0,
  billCount: ledger.value?.billCount || 0
}))
</script>

<template>
  <view class="detail-page">
    <scroll-view scroll-y class="detail-scroll">
      <!-- 封面 -->
      <view class="cover">
        <image class="cover-img" :src="coverUrl" mode="aspectFill" />
        <view class="cover-nav" :style="overlayNavStyle">
          <view class="cover-btn" @click="goBack">
            <Icon name="chevron-left" color="#FFFFFF" :weight="2" size="36rpx" />
          </view>
          <view class="cover-btn">
            <Icon name="dots" color="#FFFFFF" :weight="2.6" size="34rpx" />
          </view>
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
          <text class="stat-num">{{ book.journalCount || 0 }}</text>
          <text class="stat-label">篇旅记</text>
        </view>
        <view class="stat-divider" />
        <view class="stat-item">
          <text class="stat-num">{{ book.spotCount || 0 }}</text>
          <text class="stat-label">个地点</text>
        </view>
        <view class="stat-divider" />
        <view class="stat-item">
          <text class="stat-num">{{ book.tripDays || 0 }}</text>
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
          <text class="lh-title">全部旅记 <text class="lh-count">{{ journals.length }}</text></text>
          <text class="lh-action">按时间 ›</text>
        </view>
        <view
          v-for="(j, i) in journals"
          :key="j.id"
          class="journal-card tj-card"
          @click="goJournal(j.id)"
        >
          <view class="jc-thumb">
            <image class="jc-img" :src="thumbOf(i, j)" mode="aspectFill" />
          </view>
          <view class="jc-info">
            <text class="jc-title">{{ j.title }}</text>
            <text class="jc-meta">{{ formatDate(j.travelDate) }} · {{ j.locationName || '未记录地点' }}</text>
            <text class="jc-excerpt">{{ j.content }}</text>
          </view>
        </view>

        <view v-if="!loading && !journals.length" class="tab-empty">
          <text>还没有旅记，点右下角开始记录</text>
        </view>
      </view>

      <!-- 账本 Tab -->
      <view v-else class="tab-content">
        <view class="ledger-stats tj-card">
          <view class="ls-item">
            <text class="ls-num">{{ formatMoneyInt(ledgerSummary.totalExpense) }}</text>
            <text class="ls-label">总支出</text>
          </view>
          <view class="ls-divider" />
          <view class="ls-item">
            <text class="ls-num">{{ formatMoneyInt(ledgerSummary.avgExpense) }}</text>
            <text class="ls-label">人均花费</text>
          </view>
          <view class="ls-divider" />
          <view class="ls-item">
            <text class="ls-num">{{ ledgerSummary.billCount }}</text>
            <text class="ls-label">记账笔数</text>
          </view>
        </view>

        <view class="list-header">
          <text class="lh-title">账单明细 <text class="lh-count green">{{ ledgerSummary.billCount }}</text></text>
          <text class="lh-action">按日期 ›</text>
        </view>

        <view v-for="g in groupedBills" :key="g.date" class="bill-group">
          <text class="bg-date">{{ g.label }}</text>
          <view v-for="b in g.items" :key="b.id" class="bill-card tj-card">
            <view class="bc-icon" :class="'cat-' + billCatClass(b.category)">
              <Icon :name="billCatIcon(b.category)" size="32rpx" :weight="1.6" :color="'#2E9E6B'" />
            </view>
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

.tab-empty {
  padding: 60rpx 0;
  display: flex;
  justify-content: center;
  font-size: 24rpx;
  color: #a9b5ac;
}

.cover {
  position: relative;
  height: 560rpx;
  background: #cdd9d2;
  .cover-img {
    width: 100%;
    height: 100%;
    display: block;
  }
  .cover-nav {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    padding: 0 32rpx;
    display: flex;
    justify-content: space-between;
    .cover-btn {
      width: 72rpx;
      height: 72rpx;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.26);
      display: flex;
      align-items: center;
      justify-content: center;
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
    &.cat-food { background: #fbeee0; }
    &.cat-transport { background: #eaf1ff; }
    &.cat-hotel { background: #fcecf4; }
    &.cat-ticket { background: #f0ebfb; }
    &.cat-shop { background: #ecf4ee; }
    &.cat-other { background: #f0f3f0; }
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
