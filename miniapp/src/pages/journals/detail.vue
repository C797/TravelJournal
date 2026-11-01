<script setup lang="ts">
import { ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { mockJournals } from '@/mock'

const journal = ref(mockJournals[0])

onLoad((query: any) => {
  if (query?.id) {
    const found = mockJournals.find((j) => j.id === query.id)
    if (found) journal.value = found
  }
})

function goBack() {
  uni.navigateBack()
}
</script>

<template>
  <view class="detail-page">
    <scroll-view scroll-y class="detail-scroll">
      <!-- 头图 -->
      <view class="hero">
        <text class="hero-emoji">🏞️</text>
        <view class="hero-nav">
          <view class="hero-btn" @click="goBack"><text>‹</text></view>
          <view class="hero-btn"><text>···</text></view>
        </view>
      </view>

      <!-- 内容卡片 -->
      <view class="content-card">
        <text class="cc-tag">TRAVEL NOTE / 10.05</text>
        <text class="cc-title">蓝色星球最后的净土</text>
        <view class="cc-loc">
          <text class="loc-icon">📍</text>
          <text>四川 · 稻城亚丁 · 牛奶海</text>
        </view>
        <view class="cc-weather">
          <text class="weather-icon">☀️</text>
          <text>多云转晴　12°C</text>
        </view>

        <view class="cc-divider" />

        <text class="cc-body">
          早上六点从香格里拉镇出发，沿着盘山公路一路向上。翻越 4600 米的俄初山垭口时，晨雾正慢慢散开，露出远处雪山的轮廓。
        </text>
        <text class="cc-body">
          牛奶海像一颗蓝宝石嵌在央迈勇雪山之间，湖水清得能看见湖底的石子。海拔 4700 米的徒步，每一步都在与自己对话。
        </text>

        <view class="gallery-header">
          <text class="gh-title">旅途影像</text>
          <text class="gh-count">共 3 张</text>
        </view>
        <view class="gallery">
          <view class="gallery-item"><text>🏔️</text></view>
          <view class="gallery-item"><text>🌫️</text></view>
          <view class="gallery-item"><text>🏘️</text></view>
        </view>
      </view>
    </scroll-view>
  </view>
</template>

<style lang="scss" scoped>
.detail-page { min-height: 100vh; background: #fff; }
.detail-scroll { height: 100vh; }

.hero {
  position: relative;
  height: 620rpx;
  background: linear-gradient(170deg, #7aa8b8, #3a6a78);
  display: flex;
  align-items: center;
  justify-content: center;
  .hero-emoji { font-size: 160rpx; }
  .hero-nav {
    position: absolute;
    top: 60rpx;
    left: 0;
    right: 0;
    padding: 0 32rpx;
    display: flex;
    justify-content: space-between;
    .hero-btn {
      width: 72rpx;
      height: 72rpx;
      border-radius: 50%;
      background: rgba(255,255,255,0.4);
      color: #333;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 40rpx;
    }
  }
}

.content-card {
  margin-top: -48rpx;
  position: relative;
  background: #fff;
  border-radius: 48rpx 48rpx 0 0;
  padding: 48rpx 40rpx;
  display: flex;
  flex-direction: column;
  .cc-tag { font-size: 22rpx; color: #b0b0b0; letter-spacing: 3rpx; }
  .cc-title { margin-top: 16rpx; font-size: 44rpx; font-weight: 700; color: #1f3d33; }
  .cc-loc, .cc-weather {
    margin-top: 16rpx;
    display: flex;
    align-items: center;
    gap: 10rpx;
    font-size: 26rpx;
    color: #555;
    .loc-icon, .weather-icon { font-size: 28rpx; }
  }
  .cc-weather { color: #999; }
  .cc-divider { height: 1rpx; background: #eee; margin: 32rpx 0; }
  .cc-body {
    font-size: 30rpx;
    color: #333;
    line-height: 1.8;
    margin-bottom: 24rpx;
  }
  .gallery-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin: 16rpx 0;
    .gh-title { font-size: 30rpx; font-weight: 700; }
    .gh-count { font-size: 22rpx; color: #999; }
  }
  .gallery {
    display: flex;
    gap: 16rpx;
    .gallery-item {
      flex: 1;
      height: 200rpx;
      border-radius: 16rpx;
      background: #e8f0ea;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 72rpx;
    }
  }
}
</style>
