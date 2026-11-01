<script setup lang="ts">
import { ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { mockInvitation } from '@/mock'

const invitation = ref(mockInvitation)

onLoad(() => {})

function goBack() {
  uni.navigateBack()
}

function copyCode() {
  uni.setClipboardData({
    data: invitation.value.code,
    success: () => uni.showToast({ title: '邀请码已复制', icon: 'success' })
  })
}

function share() {
  uni.showToast({ title: '分享邀请已触发', icon: 'none' })
}
</script>

<template>
  <view class="invite-page">
    <view class="tj-nav">
      <text class="tj-nav-back" @click="goBack">‹</text>
      <text class="tj-nav-title">邀请好友</text>
      <text class="tj-nav-action">···</text>
    </view>

    <scroll-view scroll-y class="invite-scroll">
      <view class="header">
        <text class="title">让旅程中的每个人</text>
        <text class="title">都能一起记录。</text>
        <text class="subtitle">邀请好友加入「川西之旅」共同账本</text>
      </view>

      <!-- 邀请码卡片 -->
      <view class="code-card">
        <text class="code-label">INVITATION CODE</text>
        <text class="code-value">{{ invitation.code }}</text>
        <view class="code-divider" />
        <text class="expire-label">有效期至</text>
        <text class="expire-value">{{ invitation.expireAt }}</text>
        <text class="code-desc">好友输入邀请码，即可加入同一账本</text>
        <view class="copy-btn" @click="copyCode">复制邀请码</view>
      </view>

      <!-- 邀请方式 -->
      <view class="method-section">
        <text class="ms-title">邀请方式</text>
        <view class="method-card tj-card">
          <view class="mc-icon"><text>微</text></view>
          <view class="mc-info">
            <text class="mc-name">发送给微信好友</text>
            <text class="mc-desc">通过微信会话分享邀请信息</text>
          </view>
          <text class="mc-arrow">›</text>
        </view>
      </view>

      <text class="warn-text">温馨提示：邀请码仅可使用一次，请分享给本次旅程的同行伙伴。</text>
      <button class="tj-btn-primary share-btn" @click="share">分享邀请</button>
      <view class="bottom-space" />
    </scroll-view>
  </view>
</template>

<style lang="scss" scoped>
.invite-page {
  min-height: 100vh;
  background: #f2f2f0;
  display: flex;
  flex-direction: column;
}
.invite-scroll { flex: 1; padding: 0 32rpx; }

.header {
  margin-top: 32rpx;
  display: flex;
  flex-direction: column;
  gap: 8rpx;
  .title { font-size: 42rpx; font-weight: 800; }
  .subtitle { margin-top: 8rpx; font-size: 26rpx; color: #9e9e9e; }
}

.code-card {
  margin-top: 40rpx;
  background: #1e4031;
  border-radius: 32rpx;
  padding: 48rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  .code-label { font-size: 22rpx; color: #9db8a5; letter-spacing: 4rpx; }
  .code-value {
    margin-top: 20rpx;
    font-size: 72rpx;
    font-weight: 700;
    color: #f5f1e8;
    letter-spacing: 6rpx;
  }
  .code-divider {
    width: 100%;
    height: 1rpx;
    background: rgba(255,255,255,0.2);
    margin: 32rpx 0;
  }
  .expire-label { font-size: 22rpx; color: #9db8a5; }
  .expire-value { margin-top: 8rpx; font-size: 28rpx; font-weight: 600; color: #f5f1e8; }
  .code-desc { margin-top: 16rpx; font-size: 24rpx; color: #9db8a5; }
  .copy-btn {
    margin-top: 32rpx;
    padding: 16rpx 48rpx;
    border-radius: 999rpx;
    background: #e5e5e0;
    color: #1e4031;
    font-size: 26rpx;
    font-weight: 600;
  }
}

.method-section {
  margin-top: 40rpx;
  .ms-title { font-size: 28rpx; font-weight: 700; }
  .method-card {
    margin-top: 16rpx;
    display: flex;
    align-items: center;
    padding: 28rpx;
    .mc-icon {
      width: 72rpx;
      height: 72rpx;
      border-radius: 50%;
      background: #d9ebdd;
      color: #3ba05f;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 32rpx;
    }
    .mc-info {
      flex: 1;
      margin-left: 20rpx;
      display: flex;
      flex-direction: column;
      gap: 6rpx;
      .mc-name { font-size: 28rpx; font-weight: 700; }
      .mc-desc { font-size: 22rpx; color: #999; }
    }
    .mc-arrow { font-size: 36rpx; color: #999; }
  }
}

.warn-text {
  display: block;
  margin-top: 32rpx;
  font-size: 22rpx;
  color: #9e9e9e;
  text-align: center;
}
.share-btn { margin-top: 24rpx; width: 100%; }
.bottom-space { height: 60rpx; }
</style>
