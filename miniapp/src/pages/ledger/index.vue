<script setup lang="ts">
import { ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import TabBar from '@/components/TabBar.vue'
import { mockBills, mockLedger } from '@/mock'
import { formatMoney } from '@/utils'

const ledger = ref(mockLedger)
const bills = ref(mockBills)

onLoad(() => {})

function goRecord() {
  uni.navigateTo({ url: '/pages/ledger/record' })
}

function goStats() {
  uni.navigateTo({ url: '/pages/ledger/stats' })
}

function goMembers() {
  uni.navigateTo({ url: '/pages/ledger/members' })
}

function goInvite() {
  uni.navigateTo({ url: '/pages/ledger/invite' })
}

function onQuick() {
  uni.navigateTo({ url: '/pages/ledger/record' })
}

const catIcon: Record<string, string> = {
  餐饮: '🍲', 交通: '✈️', 住宿: '🏠', 门票: '🎫', 购物: '☕', 其他: '💵'
}
const catBg: Record<string, string> = {
  餐饮: '#FFF3E0', 交通: '#E3F0FF', 住宿: '#FDE8EE', 门票: '#EFE9FF', 购物: '#E8F3EC', 其他: '#E0F5EA'
}
</script>

<template>
  <view class="tj-page ledger-page">
    <view class="status-bar"><text class="time">9:41</text></view>

    <view class="header">
      <view class="header-top">
        <text class="title">川西之旅 · 账本</text>
        <view class="switch-btn">切换 ⌄</view>
      </view>
    </view>

    <!-- 统计卡片 -->
    <view class="stats-card tj-card">
      <view class="stat-item">
        <text class="stat-num">¥8,642</text>
        <text class="stat-label">本月支出</text>
      </view>
      <view class="stat-divider" />
      <view class="stat-item">
        <text class="stat-num">¥1,280</text>
        <text class="stat-label">本月收入</text>
      </view>
      <view class="stat-divider" />
      <view class="stat-item">
        <text class="stat-num">¥3,518</text>
        <text class="stat-label">当前结余</text>
      </view>
    </view>

    <!-- 今日消费 + 记一笔 -->
    <view class="today-card">
      <view class="today-info">
        <text class="today-label">今日消费</text>
        <text class="today-num">¥ 186.50</text>
      </view>
      <view class="record-btn" @click="goRecord">＋ 记一笔</view>
    </view>

    <!-- 账单列表 -->
    <view class="bill-header">
      <text class="bh-title">今天 · 10月5日</text>
    </view>
    <view class="bill-list">
      <view v-for="b in bills" :key="b.id" class="bill-card tj-card">
        <view class="bc-icon" :style="{ background: catBg[b.category] || '#f0f0f0' }">
          <text>{{ catIcon[b.category] || '💵' }}</text>
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

    <!-- 快捷入口 -->
    <view class="quick-entry">
      <view class="qe-item" @click="goStats"><text>📊</text><text>账本统计</text></view>
      <view class="qe-item" @click="goMembers"><text>👥</text><text>成员管理</text></view>
      <view class="qe-item" @click="goInvite"><text>💌</text><text>邀请好友</text></view>
    </view>

    <TabBar active="ledger" @quick="onQuick" />
  </view>
</template>

<style lang="scss" scoped>
.ledger-page { padding: 0 32rpx 160rpx; }
.status-bar { height: 60rpx; display: flex; align-items: center; .time { font-weight: 700; font-size: 30rpx; } }

.header {
  margin-top: 16rpx;
  .header-top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    .title { font-size: 40rpx; font-weight: 800; }
    .switch-btn {
      padding: 10rpx 28rpx;
      border-radius: 999rpx;
      background: #fff;
      color: #2e9e6b;
      border: 2rpx solid #d8efe2;
      font-size: 24rpx;
    }
  }
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
  .record-btn {
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
</style>
