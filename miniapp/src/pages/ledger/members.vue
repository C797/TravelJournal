<script setup lang="ts">
import { ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { mockLedgerMembers } from '@/mock'

const members = ref(mockLedgerMembers)

const roleMap: Record<string, string> = {
  creator: '创建者',
  admin: '管理员',
  member: '成员'
}

const avatarColors = ['#d6eadd', '#f5e3d0', '#d6def0']
const avatarTextColors = ['#3d8b5f', '#d08a4e', '#5c79c4']

onLoad(() => {})

function goBack() {
  uni.navigateBack()
}

function goInvite() {
  uni.navigateTo({ url: '/pages/ledger/invite' })
}
</script>

<template>
  <view class="members-page">
    <view class="tj-nav">
      <text class="tj-nav-back" @click="goBack">‹</text>
      <text class="tj-nav-title">账本成员</text>
    </view>

    <scroll-view scroll-y class="members-scroll">
      <view class="header">
        <text class="title">一起记录，共享每一笔旅费</text>
        <text class="subtitle">川西之旅账本 · 共同记录每一笔</text>
      </view>

      <view class="list-header">
        <text class="lh-title">成员列表</text>
        <text class="lh-count">{{ members.length }} 人</text>
      </view>

      <view class="member-list tj-card">
        <view v-for="(m, i) in members" :key="m.id" class="member-item">
          <view class="mi-avatar" :style="{ background: avatarColors[i % 3] }">
            <text :style="{ color: avatarTextColors[i % 3] }">{{ (m.user?.nickname || '王').slice(-1) }}</text>
          </view>
          <view class="mi-info">
            <text class="mi-name">{{ m.user?.nickname }}</text>
            <text class="mi-date">加入于 {{ m.joinedAt }}</text>
          </view>
          <text class="mi-role">{{ roleMap[m.role] }}</text>
          <view v-if="i < members.length - 1" class="mi-divider" />
        </view>
      </view>

      <view class="perm-card">
        <text class="perm-title">成员权限</text>
        <text class="perm-desc">创建者可管理账本与成员；管理员可协助维护账单，成员可共同记录收支。</text>
      </view>
    </scroll-view>

    <view class="invite-btn" @click="goInvite">＋ 邀请新成员</view>
  </view>
</template>

<style lang="scss" scoped>
.members-page {
  min-height: 100vh;
  background: #f7f7f7;
  display: flex;
  flex-direction: column;
}
.members-scroll { flex: 1; padding: 0 32rpx; padding-bottom: 160rpx; }

.header {
  margin-top: 32rpx;
  display: flex;
  flex-direction: column;
  gap: 12rpx;
  .title { font-size: 40rpx; font-weight: 800; }
  .subtitle { font-size: 26rpx; color: #999; }
}

.list-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: 32rpx 0 16rpx;
  .lh-title { font-size: 30rpx; font-weight: 700; }
  .lh-count { font-size: 24rpx; color: #999; }
}

.member-list {
  padding: 0 28rpx;
  .member-item {
    position: relative;
    display: flex;
    align-items: center;
    padding: 28rpx 0;
    .mi-avatar {
      width: 80rpx;
      height: 80rpx;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 32rpx;
      font-weight: 700;
    }
    .mi-info {
      flex: 1;
      margin-left: 20rpx;
      display: flex;
      flex-direction: column;
      gap: 4rpx;
      .mi-name { font-size: 28rpx; font-weight: 700; }
      .mi-date { font-size: 22rpx; color: #999; }
    }
    .mi-role { font-size: 24rpx; color: #999; }
    .mi-divider {
      position: absolute;
      left: 0;
      right: 0;
      bottom: 0;
      height: 1rpx;
      background: #f0f0f0;
    }
  }
}

.perm-card {
  margin-top: 24rpx;
  background: #e8f3eb;
  border-radius: 20rpx;
  padding: 28rpx;
  display: flex;
  flex-direction: column;
  gap: 12rpx;
  .perm-title { font-size: 28rpx; font-weight: 700; }
  .perm-desc { font-size: 24rpx; color: #555; line-height: 1.7; }
}

.invite-btn {
  position: fixed;
  left: 32rpx;
  right: 32rpx;
  bottom: 40rpx;
  height: 96rpx;
  border-radius: 48rpx;
  background: #3d8b5f;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32rpx;
  font-weight: 600;
}
</style>
