<script setup lang="ts">
import { ref, computed } from 'vue'
import { onLoad, onShow } from '@dcloudio/uni-app'
import TabBar from '@/components/TabBar.vue'
import Icon from '@/components/Icon.vue'
import { useAppStore } from '@/stores/app'
import { useLedgerStore } from '@/stores/ledger'
import { billApi } from '@/api/ledger'
import type { Bill } from '@/types'
import { formatMoney, formatMoneyInt } from '@/utils'
import { statusBarStyle, navRightStyle } from '@/utils/safe-area'

const appStore = useAppStore()
const ledgerStore = useLedgerStore()

const ledgers = computed(() => ledgerStore.ledgers)
const currentId = computed(() => ledgerStore.currentId)
const current = computed(() => ledgerStore.current)

/** 当前账本的账单 */
const bills = ref<Bill[]>([])
const loading = ref(false)

/** 账单区标题：今天 + 日期 */
const todayLabel = computed(() => {
  const d = new Date()
  return `今天 · ${d.getMonth() + 1}月${d.getDate()}日`
})

// 标题：「川西之旅账本」→「川西之旅 · 账本」
const titleText = computed(() => {
  const name = current.value?.name || '账本'
  return name.endsWith('账本') ? `${name.slice(0, -2)} · 账本` : name
})

// 账本切换下拉
const showSwitcher = ref(false)

async function loadBills() {
  if (!current.value?.id) {
    bills.value = []
    return
  }
  const page = await billApi.list(current.value.id, 1, 50).catch(() => null)
  bills.value = page?.list || []
}

async function loadData() {
  loading.value = true
  try {
    await appStore.init()
    await appStore.ensureLogin()
    await ledgerStore.load(true)
    await loadBills()
  } finally {
    loading.value = false
  }
}

onLoad(() => {
  loadData()
})

onShow(() => {
  // 记一笔 / 新建账本后返回，刷新数据
  if (ledgerStore.ready) loadData()
})

function toggleSwitcher() {
  showSwitcher.value = !showSwitcher.value
}

async function pickLedger(id: string) {
  ledgerStore.switchTo(id)
  showSwitcher.value = false
  await loadBills()
}

/** 新建账本改为跳转独立页面 */
function openCreate() {
  showSwitcher.value = false
  uni.navigateTo({ url: '/pages/ledger/create' })
}

function goRecord() {
  if (!current.value) {
    uni.showToast({ title: '请先新建账本', icon: 'none' })
    return
  }
  uni.navigateTo({ url: `/pages/ledger/record?ledgerId=${current.value.id}` })
}

function goStats() {
  if (!current.value) return
  uni.navigateTo({ url: `/pages/ledger/stats?ledgerId=${current.value.id}` })
}

function goMembers() {
  if (!current.value) return
  uni.navigateTo({ url: `/pages/ledger/members?ledgerId=${current.value.id}` })
}

function goInvite() {
  if (!current.value) return
  uni.navigateTo({ url: `/pages/ledger/invite?ledgerId=${current.value.id}` })
}

function onQuick() {
  goRecord()
}

// 与记账页同一套分类图标与配色
const catIcon: Record<string, string> = {
  餐饮: 'bowl', 交通: 'send', 住宿: 'house', 门票: 'triangle', 购物: 'bag', 其他: 'dots'
}
const catBg: Record<string, string> = {
  餐饮: '#FBEEE0', 交通: '#EAF1FF', 住宿: '#FCECF4', 门票: '#F0EBFB', 购物: '#ECF4EE', 其他: '#F0F3F0'
}
const catFg: Record<string, string> = {
  餐饮: '#D9822B', 交通: '#4A7BC7', 住宿: '#C8577E', 门票: '#796AC7', 购物: '#5C8A72', 其他: '#6A746F'
}
</script>

<template>
  <view class="tj-page ledger-page">
    <view class="status-bar" :style="statusBarStyle" />

    <view class="header">
      <view class="header-top" :style="navRightStyle">
        <text class="title">{{ titleText }}</text>
        <view class="header-actions">
          <!-- 账本切换（下拉选择） -->
          <view class="switch-btn" :class="{ open: showSwitcher }" @click="toggleSwitcher">
            <text>切换</text>
            <Icon name="chevron-down" color="#2E9E6B" :weight="2" size="22rpx" class="sw-arrow" />
          </view>
          <!-- 新建账本 -->
          <view class="create-btn" @click="openCreate">
            <Icon name="plus" color="#FFFFFF" :weight="2.2" size="30rpx" />
          </view>
        </view>
      </view>

      <!-- 账本下拉列表 -->
      <view v-if="showSwitcher" class="switcher-panel">
        <view
          v-for="l in ledgers"
          :key="l.id"
          class="sw-item"
          :class="{ active: l.id === currentId }"
          @click="pickLedger(l.id)"
        >
          <view class="sw-dot" :class="{ on: l.id === currentId }">
            <Icon v-if="l.id === currentId" name="check" color="#FFFFFF" :weight="2.4" size="20rpx" />
          </view>
          <view class="sw-info">
            <text class="sw-name">{{ l.name }}</text>
            <text class="sw-desc">{{ l.billCount || 0 }} 笔账单 · 本月支出 {{ formatMoneyInt(l.monthExpense || 0) }}</text>
          </view>
        </view>
        <view class="sw-create" @click="openCreate">
          <Icon name="plus" color="#2E9E6B" :weight="2" size="26rpx" />
          <text>新建账本</text>
        </view>
      </view>

      <!-- 遮罩：点击空白处收起下拉 -->
      <view v-if="showSwitcher" class="sw-mask" @click="showSwitcher = false" />
    </view>

    <!-- 统计卡片 -->
    <view class="stats-card tj-card">
      <view class="stat-item">
        <text class="stat-num">{{ formatMoneyInt(current?.monthExpense || 0) }}</text>
        <text class="stat-label">本月支出</text>
      </view>
      <view class="stat-divider" />
      <view class="stat-item">
        <text class="stat-num">{{ formatMoneyInt(current?.monthIncome || 0) }}</text>
        <text class="stat-label">本月收入</text>
      </view>
      <view class="stat-divider" />
      <view class="stat-item">
        <text class="stat-num">{{ formatMoneyInt(current?.monthBalance || 0) }}</text>
        <text class="stat-label">当前结余</text>
      </view>
    </view>

    <!-- 今日消费 + 记一笔 -->
    <view class="today-card">
      <view class="today-info">
        <text class="today-label">今日消费</text>
        <text class="today-num">{{ formatMoney(current?.todayExpense || 0) }}</text>
      </view>
      <view class="record-btn" @click="goRecord">
        <Icon name="plus" color="#FFFFFF" :weight="1.9" size="28rpx" />
        <text class="record-txt">记一笔</text>
      </view>
    </view>

    <!-- 账单列表 -->
    <view class="bill-header">
      <text class="bh-title">{{ todayLabel }}</text>
    </view>
    <view class="bill-list">
      <view v-for="b in bills" :key="b.id" class="bill-card tj-card">
        <view class="bc-icon" :style="{ background: catBg[b.category] || '#EAF3EC' }">
          <Icon
            :name="catIcon[b.category] || 'dots'"
            :color="catFg[b.category] || '#2E9E6B'"
            :weight="1.6"
            size="36rpx"
          />
        </view>
        <view class="bc-info">
          <text class="bc-title">{{ b.category }} · {{ b.subCategory }}</text>
          <text class="bc-remark">{{ b.remark }}</text>
        </view>
        <text class="bc-amount" :class="{ income: b.billType === 'income' }">
          {{ b.billType === 'income' ? '+' : '-' }}¥{{ b.amount.toFixed(2) }}
        </text>
      </view>

      <!-- 空态 -->
      <view v-if="!bills.length" class="bill-empty">
        <Icon name="wallet" color="#C4CCC6" :weight="1.5" size="72rpx" />
        <text class="be-title">还没有账单</text>
        <text class="be-desc">记下第一笔开销，开始管理这个账本</text>
      </view>
    </view>


    <TabBar active="ledger" @quick="onQuick" />
  </view>
</template>

<style lang="scss" scoped>
.ledger-page { padding: 0 32rpx calc(240rpx + env(safe-area-inset-bottom)); }
/* 高度由 utils/safe-area.ts 按机型注入 */
.status-bar {
  width: 100%;
}

.header {
  position: relative;
  margin-top: 16rpx;
  .header-top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16rpx;
    .title {
      flex: 1;
      min-width: 0;
      font-size: 36rpx;
      font-weight: 800;
      letter-spacing: -0.2rpx;
      overflow: hidden;
      white-space: nowrap;
      text-overflow: ellipsis;
    }
  }
  .header-actions {
    display: flex;
    align-items: center;
    gap: 14rpx;
    flex-shrink: 0;
  }
  .switch-btn {
    display: flex;
    align-items: center;
    gap: 4rpx;
    padding: 10rpx 20rpx 10rpx 24rpx;
    border-radius: 999rpx;
    background: #fff;
    color: #2e9e6b;
    border: 2rpx solid #d8efe2;
    font-size: 22rpx;
    font-weight: 600;
    transition: all 0.18s;
    .sw-arrow { transition: transform 0.2s; }
    &.open {
      background: #eaf5ee;
      border-color: #b9dfc9;
      .sw-arrow { transform: rotate(180deg); }
    }
  }
  /* 新建账本：圆形主色按钮 */
  .create-btn {
    width: 56rpx;
    height: 56rpx;
    border-radius: 50%;
    background: #1e9e6a;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 4rpx 12rpx rgba(30, 158, 106, 0.28);
  }
}

/* 账本下拉面板 */
.switcher-panel {
  position: absolute;
  right: 0;
  top: 76rpx;
  z-index: 60;
  width: 460rpx;
  background: #fff;
  border-radius: 24rpx;
  padding: 12rpx;
  box-shadow: 0 12rpx 36rpx rgba(26, 46, 42, 0.14);
  .sw-item {
    display: flex;
    align-items: center;
    padding: 18rpx 16rpx;
    border-radius: 16rpx;
    &.active { background: #f2faf5; }
    .sw-dot {
      width: 36rpx;
      height: 36rpx;
      border-radius: 50%;
      border: 2rpx solid #d8e2dc;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      &.on {
        background: #1e9e6a;
        border-color: #1e9e6a;
      }
    }
    .sw-info {
      flex: 1;
      min-width: 0;
      margin-left: 16rpx;
      display: flex;
      flex-direction: column;
      gap: 4rpx;
      .sw-name {
        font-size: 26rpx;
        font-weight: 600;
        color: #1a2e2a;
        overflow: hidden;
        white-space: nowrap;
        text-overflow: ellipsis;
      }
      .sw-desc {
        font-size: 20rpx;
        color: #9aa39d;
        overflow: hidden;
        white-space: nowrap;
        text-overflow: ellipsis;
      }
    }
  }
  /* 面板底部新建入口 */
  .sw-create {
    margin-top: 6rpx;
    padding: 20rpx 16rpx;
    border-top: 1rpx solid #f0f3f1;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8rpx;
    text {
      font-size: 24rpx;
      font-weight: 600;
      color: #2e9e6b;
    }
  }
}

/* 下拉遮罩（点击空白收起） */
.sw-mask {
  position: fixed;
  inset: 0;
  z-index: 50;
}

.stats-card {
  margin-top: 24rpx;
  display: flex;
  align-items: center;
  padding: 32rpx 0;
  .stat-item {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6rpx;
    .stat-num { font-size: 36rpx; font-weight: 700; }
    .stat-label { font-size: 22rpx; color: #999; }
  }
  .stat-divider { width: 1rpx; height: 60rpx; background: #eee; }
}

.today-card {
  margin-top: 24rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 24rpx 8rpx;
  .today-info {
    display: flex;
    flex-direction: column;
    gap: 6rpx;
    .today-label { font-size: 24rpx; color: #999; }
    .today-num { font-size: 44rpx; font-weight: 700; }
  }
  .record-txt {
  font-size: 26rpx;
  font-weight: 600;
  color: #ffffff;
}

.record-btn {
  display: flex;
  align-items: center;
  gap: 6rpx;
    padding: 16rpx 36rpx;
    border-radius: 999rpx;
    background: #1e9e6a;
    color: #fff;
    font-size: 26rpx;
  }
}

.bill-header {
  margin: 16rpx 0;
  .bh-title { font-size: 30rpx; font-weight: 700; }
}

.bill-list {
  .bill-card {
    display: flex;
    align-items: center;
    padding: 24rpx;
    margin-bottom: 12rpx;
    .bc-icon {
      width: 80rpx;
      height: 80rpx;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 40rpx;
      flex-shrink: 0;
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
    .bc-amount { font-size: 30rpx; font-weight: 700; &.income { color: #1e9e6a; } }
  }
}

.quick-entry {
  margin-top: 24rpx;
  display: flex;
  gap: 20rpx;
  .qe-item {
    flex: 1;
    background: #fff;
    border-radius: 20rpx;
    padding: 28rpx;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12rpx;
    font-size: 24rpx;
    color: #555;
    text:first-child { font-size: 44rpx; }
  }
}

/* 账单空态 */
.bill-empty {
  padding: 90rpx 0 60rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12rpx;
  .be-title {
    margin-top: 8rpx;
    font-size: 28rpx;
    font-weight: 600;
    color: #6b7570;
  }
  .be-desc {
    font-size: 22rpx;
    color: #9aa39d;
  }
}

</style>
