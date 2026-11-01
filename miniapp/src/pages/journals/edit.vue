<script setup lang="ts">
import { ref, computed } from 'vue'
import { onLoad } from '@dcloudio/uni-app'

const bookId = ref('')
const title = ref('')
const content = ref('')
const weather = ref('晴朗 12℃')
const travelDate = ref('2025-06-14')
const location = ref('四川 · 稻城亚丁')
const linkedSpot = ref('牛奶海')
const visibility = ref<'private' | 'public'>('private')
const photos = ref<string[]>(['🏔️', '🏞️', '🏘️'])

const titleLen = computed(() => title.value.length)
const contentLen = computed(() => content.value.length)

onLoad((query: any) => {
  if (query?.bookId) bookId.value = query.bookId
})

function goBack() {
  uni.navigateBack()
}

function addPhoto() {
  uni.chooseImage({
    count: 9,
    success: (res) => {
      photos.value = [...photos.value, ...res.tempFilePaths.map(() => '🖼️')]
    }
  })
}

function removePhoto(i: number) {
  photos.value.splice(i, 1)
}

function publish() {
  if (!bookId.value) {
    uni.showToast({ title: '请选择所属旅行册', icon: 'none' })
    return
  }
  if (!title.value) {
    uni.showToast({ title: '请填写游记名称', icon: 'none' })
    return
  }
  uni.showToast({ title: '发布成功', icon: 'success' })
  setTimeout(() => uni.navigateBack(), 800)
}
</script>

<template>
  <view class="edit-page">
    <view class="tj-nav">
      <text class="tj-nav-back" @click="goBack">取消</text>
      <text class="tj-nav-title">写游记</text>
      <view class="publish-btn" @click="publish">发布</view>
    </view>

    <scroll-view scroll-y class="edit-scroll">
      <!-- 相册 -->
      <view class="field">
        <view class="field-label">
          <text class="label-name">相册</text>
          <text class="label-tip">{{ photos.length }} 张照片</text>
        </view>
        <view class="photo-list">
          <view v-for="(p, i) in photos" :key="i" class="photo-item" @click="removePhoto(i)">
            <text class="photo-emoji">{{ p }}</text>
          </view>
          <view class="photo-add" @click="addPhoto">
            <text class="pa-plus">＋</text>
            <text class="pa-label">添加</text>
          </view>
        </view>
      </view>

      <!-- 所属旅行册 -->
      <view class="field">
        <view class="field-label"><text class="label-name">所属旅行册</text></view>
        <view class="select-card">
          <view class="sc-thumb"><text>🏔️</text></view>
          <text class="sc-value">川西之旅</text>
          <text class="sc-arrow">⌄</text>
        </view>
      </view>

      <!-- 游记名称 -->
      <view class="field">
        <view class="field-label">
          <text class="label-name">游记名称</text>
          <text class="label-required">必填</text>
        </view>
        <view class="input-card">
          <input v-model="title" class="input" maxlength="20" placeholder="给这段旅程取个名字" />
          <text class="counter">{{ titleLen }}/20</text>
        </view>
      </view>

      <!-- 出行信息 -->
      <view class="field">
        <view class="field-label">
          <text class="label-name">出行信息</text>
          <text class="label-tip green">第 1 天 · 共 15 天</text>
        </view>
        <view class="two-col">
          <view class="col-card">
            <text class="cc-label">出行日期</text>
            <text class="cc-value">06.14 周六</text>
          </view>
          <view class="col-card">
            <text class="cc-label">天气</text>
            <text class="cc-value">{{ weather }}</text>
          </view>
        </view>
      </view>

      <!-- 地点 -->
      <view class="field">
        <view class="field-label">
          <text class="label-name">地点</text>
          <text class="label-tip">已关联 1 处</text>
        </view>
        <view class="two-col">
          <view class="col-card">
            <text class="cc-label">旅行地点</text>
            <text class="cc-value">{{ location }}</text>
          </view>
          <view class="col-card">
            <text class="cc-label">关联地点</text>
            <text class="cc-value green">{{ linkedSpot }}</text>
          </view>
        </view>
      </view>

      <!-- 旅途正文 -->
      <view class="field">
        <view class="field-label">
          <text class="label-name">旅途正文</text>
          <text class="label-tip">{{ contentLen }}/2000</text>
        </view>
        <view class="content-card">
          <textarea
            v-model="content"
            class="content-area"
            maxlength="2000"
            placeholder="写下此刻的感受，那些不想忘记的细节…&#10;可以记录风景、心情，也可以只写一句话。"
          />
        </view>
      </view>

      <!-- 可见范围 -->
      <view class="field">
        <view class="field-label"><text class="label-name">可见范围</text></view>
        <view class="visibility-options">
          <view class="vis-opt" :class="{ active: visibility === 'private' }" @click="visibility = 'private'">
            <text class="vis-radio" :class="{ checked: visibility === 'private' }">{{ visibility === 'private' ? '●' : '○' }}</text>
            <view class="vis-info">
              <text class="vis-title">私密</text>
              <text class="vis-desc">仅自己可见</text>
            </view>
          </view>
          <view class="vis-opt" :class="{ active: visibility === 'public' }" @click="visibility = 'public'">
            <text class="vis-radio" :class="{ checked: visibility === 'public' }">{{ visibility === 'public' ? '●' : '○' }}</text>
            <view class="vis-info">
              <text class="vis-title">册子公开</text>
              <text class="vis-desc">本旅行册全部成员可查看</text>
            </view>
          </view>
        </view>
      </view>

      <button class="tj-btn-primary publish-main" @click="publish">发布游记</button>
      <view class="bottom-space" />
    </scroll-view>
  </view>
</template>

<style lang="scss" scoped>
.edit-page {
  min-height: 100vh;
  background: #eff3f0;
  display: flex;
  flex-direction: column;
}
.publish-btn {
  position: absolute;
  right: 24rpx;
  padding: 10rpx 32rpx;
  border-radius: 999rpx;
  background: #21a05b;
  color: #fff;
  font-size: 26rpx;
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
    .label-tip { font-size: 24rpx; color: #999; &.green { color: #21a05b; } }
    .label-required { font-size: 22rpx; color: #e8833a; background: #fdf0e0; padding: 4rpx 14rpx; border-radius: 8rpx; }
  }
}

.photo-list {
  display: flex;
  gap: 16rpx;
  flex-wrap: wrap;
  .photo-item, .photo-add {
    width: 150rpx;
    height: 150rpx;
    border-radius: 16rpx;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .photo-item {
    background: #dde8e0;
    .photo-emoji { font-size: 60rpx; }
  }
  .photo-add {
    background: #dff0e5;
    flex-direction: column;
    gap: 4rpx;
    .pa-plus { font-size: 40rpx; color: #21a05b; }
    .pa-label { font-size: 20rpx; color: #21a05b; }
  }
}

.select-card, .input-card {
  display: flex;
  align-items: center;
  background: #fff;
  border-radius: 16rpx;
  padding: 24rpx;
  .sc-thumb {
    width: 56rpx;
    height: 56rpx;
    border-radius: 12rpx;
    background: #dde8e0;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .sc-value { flex: 1; margin-left: 16rpx; font-size: 28rpx; }
  .sc-arrow { font-size: 30rpx; color: #999; }
  .input { flex: 1; font-size: 28rpx; }
  .counter { font-size: 22rpx; color: #999; }
}

.two-col {
  display: flex;
  gap: 20rpx;
  .col-card {
    flex: 1;
    background: #fff;
    border-radius: 16rpx;
    padding: 24rpx;
    display: flex;
    flex-direction: column;
    gap: 8rpx;
    .cc-label { font-size: 22rpx; color: #999; }
    .cc-value { font-size: 28rpx; font-weight: 600; &.green { color: #21a05b; } }
  }
}

.content-card {
  background: #fff;
  border-radius: 16rpx;
  padding: 24rpx;
  .content-area {
    width: 100%;
    height: 260rpx;
    font-size: 28rpx;
    line-height: 1.8;
  }
}

.visibility-options {
  display: flex;
  gap: 20rpx;
  .vis-opt {
    flex: 1;
    background: #fff;
    border-radius: 16rpx;
    padding: 28rpx;
    display: flex;
    align-items: center;
    gap: 16rpx;
    border: 2rpx solid transparent;
    &.active { border-color: #21a05b; background: #f2faf5; }
    .vis-radio { font-size: 32rpx; color: #ccc; &.checked { color: #21a05b; } }
    .vis-info {
      display: flex;
      flex-direction: column;
      gap: 4rpx;
      .vis-title { font-size: 28rpx; font-weight: 700; }
      .vis-desc { font-size: 22rpx; color: #999; }
    }
  }
}

.publish-main {
  margin-top: 32rpx;
  width: 100%;
}
.bottom-space { height: 60rpx; }
</style>
