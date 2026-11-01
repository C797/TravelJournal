<script setup lang="ts">
import { ref, computed } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { calcDays } from '@/utils'

const name = ref('川西之旅')
const startTime = ref('2025-06-01')
const endTime = ref('2025-06-15')
const isPublic = ref(false)
const invited = ref(['林', '陈', '王'])
const selectedCover = ref(0)

const tripDays = computed(() => calcDays(startTime.value, endTime.value))
const nameLen = computed(() => name.value.length)

// 5 张默认封面
const covers = ['🏔️', '🌃', '⛰️', '🏜️', '🛶']

function onStartChange(e: any) {
  startTime.value = e.detail.value
}
function onEndChange(e: any) {
  endTime.value = e.detail.value
}

function goBack() {
  uni.navigateBack()
}

function saveDraft() {
  uni.showToast({ title: '已存草稿', icon: 'success' })
}

function create() {
  if (!name.value) {
    uni.showToast({ title: '请填写旅程名称', icon: 'none' })
    return
  }
  if (!startTime.value || !endTime.value) {
    uni.showToast({ title: '请选择旅程时间', icon: 'none' })
    return
  }
  uni.showToast({ title: '创建成功', icon: 'success' })
  setTimeout(() => uni.navigateBack(), 800)
}
</script>

<template>
  <view class="edit-page">
    <view class="tj-nav">
      <text class="tj-nav-back" @click="goBack">‹</text>
      <text class="tj-nav-title">新建旅行册</text>
      <text class="tj-nav-action" @click="saveDraft">存草稿</text>
    </view>

    <scroll-view scroll-y class="edit-scroll">
      <!-- 封面 -->
      <view class="field">
        <view class="field-label">
          <text class="label-name">封面</text>
          <text class="label-tip">5 张默认封面，也可上传</text>
        </view>
        <view class="cover-preview">
          <text class="cover-preview-emoji">{{ covers[selectedCover] }}</text>
          <view class="cover-preview-info">
            <text class="cp-name">{{ name }}</text>
            <text class="cp-meta">{{ startTime }} — {{ endTime }} · 12 篇游记</text>
          </view>
          <view class="cp-check"><text>✓</text></view>
        </view>
        <view class="cover-list">
          <view
            v-for="(c, i) in covers"
            :key="i"
            class="cover-thumb"
            :class="{ selected: selectedCover === i }"
            @click="selectedCover = i"
          >
            <text>{{ c }}</text>
          </view>
          <view class="cover-upload">
            <text class="u-plus">＋</text>
            <text class="u-label">上传</text>
          </view>
        </view>
      </view>

      <!-- 旅程名称 -->
      <view class="field">
        <view class="field-label">
          <text class="label-name">旅程名称</text>
          <text class="label-required">必填</text>
        </view>
        <view class="input-card">
          <input v-model="name" class="input" maxlength="20" placeholder="给这段旅程取个名字" />
          <text class="counter">{{ nameLen }}/20</text>
        </view>
      </view>

      <!-- 旅程时间 -->
      <view class="field">
        <view class="field-label">
          <text class="label-name">旅程时间</text>
          <text class="label-tip">共 {{ tripDays }} 天</text>
        </view>
        <view class="time-row">
          <picker mode="date" :value="startTime" @change="onStartChange" class="time-picker">
            <view class="time-card">
              <text class="tc-label">开始</text>
              <text class="tc-value">{{ startTime }}</text>
            </view>
          </picker>
          <picker mode="date" :value="endTime" @change="onEndChange" class="time-picker">
            <view class="time-card">
              <text class="tc-label">结束</text>
              <text class="tc-value">{{ endTime }}</text>
            </view>
          </picker>
        </view>
      </view>

      <!-- 对所有人公开 -->
      <view class="setting-card tj-card">
        <view class="setting-info">
          <text class="setting-title">对所有人公开</text>
          <text class="setting-desc">可分享到朋友圈，任何人可查看</text>
        </view>
        <switch :checked="isPublic" color="#2E9E6B" @change="isPublic = $event.detail.value" />
      </view>

      <!-- 邀请同行好友 -->
      <view class="setting-card tj-card">
        <view class="setting-info">
          <text class="setting-title">邀请同行好友</text>
          <text class="setting-desc">好友可一起补充游记与账目</text>
        </view>
        <view class="invite-avatars">
          <view
            v-for="(a, i) in invited"
            :key="i"
            class="avatar"
            :style="{ background: ['#d6eadd', '#f5e3d0', '#d6def0'][i] }"
          >
            <text :style="{ color: ['#3d8b5f', '#d08a4e', '#5c79c4'][i] }">{{ a }}</text>
          </view>
          <text class="invite-arrow">›</text>
        </view>
      </view>

      <text class="tip-text">创建后可随时修改封面、成员与公开设置</text>
      <button class="tj-btn-primary create-btn" @click="create">创建旅行册</button>
      <view class="bottom-space" />
    </scroll-view>
  </view>
</template>

<style lang="scss" scoped>
.edit-page {
  min-height: 100vh;
  background: #eff2ef;
  display: flex;
  flex-direction: column;
}
.edit-scroll {
  flex: 1;
  padding: 0 32rpx;
}
.field {
  margin-top: 32rpx;
  .field-label {
    display: flex;
    align-items: center;
    gap: 12rpx;
    margin-bottom: 16rpx;
    .label-name { font-size: 30rpx; font-weight: 700; }
    .label-tip { font-size: 24rpx; color: #9ca3af; }
    .label-required { font-size: 22rpx; color: #f59e0b; }
  }
}

.cover-preview {
  position: relative;
  height: 360rpx;
  border-radius: 24rpx;
  background: linear-gradient(135deg, #5f8f74, #3e6a54);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  .cover-preview-emoji { font-size: 120rpx; }
  .cover-preview-info {
    position: absolute;
    left: 0;
    right: 0;
    bottom: 0;
    padding: 32rpx;
    display: flex;
    flex-direction: column;
    gap: 6rpx;
    background: linear-gradient(transparent, rgba(0,0,0,0.55));
    .cp-name { font-size: 36rpx; font-weight: 700; color: #fff; }
    .cp-meta { font-size: 22rpx; color: rgba(255,255,255,0.85); }
  }
  .cp-check {
    position: absolute;
    top: 20rpx;
    right: 20rpx;
    width: 52rpx;
    height: 52rpx;
    border-radius: 50%;
    background: #fff;
    color: #2e9e6b;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 28rpx;
  }
}

.cover-list {
  display: flex;
  gap: 16rpx;
  margin-top: 20rpx;
  .cover-thumb {
    width: 100rpx;
    height: 100rpx;
    border-radius: 16rpx;
    background: #e0e6e1;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 48rpx;
    &.selected { border: 4rpx solid #2e9e6b; }
  }
  .cover-upload {
    width: 100rpx;
    height: 100rpx;
    border-radius: 16rpx;
    background: #fff;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    .u-plus { font-size: 40rpx; color: #333; }
    .u-label { font-size: 20rpx; color: #999; }
  }
}

.input-card {
  display: flex;
  align-items: center;
  background: #fff;
  border-radius: 16rpx;
  padding: 24rpx;
  .input { flex: 1; font-size: 28rpx; }
  .counter { font-size: 22rpx; color: #9ca3af; }
}

.time-row {
  display: flex;
  gap: 20rpx;
  .time-picker { flex: 1; }
  .time-card {
    background: #fff;
    border-radius: 16rpx;
    padding: 24rpx;
    display: flex;
    flex-direction: column;
    gap: 8rpx;
    .tc-label { font-size: 22rpx; color: #999; }
    .tc-value { font-size: 28rpx; font-weight: 700; }
  }
}

.setting-card {
  margin-top: 24rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 28rpx;
  .setting-info {
    display: flex;
    flex-direction: column;
    gap: 6rpx;
    .setting-title { font-size: 30rpx; font-weight: 700; }
    .setting-desc { font-size: 24rpx; color: #999; }
  }
  .invite-avatars {
    display: flex;
    align-items: center;
    .avatar {
      width: 56rpx;
      height: 56rpx;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 24rpx;
      font-weight: 600;
      margin-left: -8rpx;
      border: 2rpx solid #fff;
      &:first-child { margin-left: 0; }
    }
    .invite-arrow { margin-left: 12rpx; color: #999; font-size: 32rpx; }
  }
}

.tip-text {
  display: block;
  text-align: center;
  margin-top: 32rpx;
  font-size: 22rpx;
  color: #9ca3af;
}
.create-btn {
  margin-top: 24rpx;
  width: 100%;
}
.bottom-space { height: 60rpx; }
</style>
