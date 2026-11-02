<script setup lang="ts">
import { ref, computed } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { journalApi } from '@/api/book'
import Icon from '@/components/Icon.vue'
import { overlayNavStyle } from '@/utils/safe-area'
import { formatDate } from '@/utils'
import type { Journal } from '@/types'

const journalId = ref('')
const journal = ref<Journal | null>(null)
const loading = ref(true)

// 无图时的占位（设计稿导出的实拍图）
const HERO_PLACEHOLDER = '/static/photos/journal-hero.jpg'
const GALLERY_PLACEHOLDER = [
  '/static/photos/journal-1.jpg',
  '/static/photos/journal-2.jpg',
  '/static/photos/journal-3.jpg'
]

/** 头图：优先游记首图 */
const heroUrl = computed(() => {
  const imgs = journal.value?.images || []
  return imgs.length ? imgs[0].url : HERO_PLACEHOLDER
})

/** 影像：优先真实图片，无图时用占位 */
const gallery = computed(() => {
  const imgs = journal.value?.images || []
  if (imgs.length > 1) return imgs.slice(1).map((i) => i.url)
  if (imgs.length === 1) return []
  return GALLERY_PLACEHOLDER
})

/** 正文按空行拆段，保留原始分段 */
const paragraphs = computed(() => {
  const text = journal.value?.content || ''
  return text
    .split(/\n+/)
    .map((s) => s.trim())
    .filter(Boolean)
})

const dateTag = computed(() => {
  const d = journal.value?.travelDate
  if (!d) return 'TRAVEL NOTE'
  const t = new Date(d)
  return `TRAVEL NOTE / ${String(t.getMonth() + 1).padStart(2, '0')}.${String(t.getDate()).padStart(2, '0')}`
})

async function loadData() {
  if (!journalId.value) {
    loading.value = false
    return
  }
  loading.value = true
  try {
    journal.value = await journalApi.detail(journalId.value)
  } catch {
    journal.value = null
  } finally {
    loading.value = false
  }
}

onLoad((query: any) => {
  journalId.value = query?.id || ''
  loadData()
})

function goBack() {
  uni.navigateBack()
}

/** 图片预览 */
function previewImage(current: string) {
  const urls = (journal.value?.images || []).map((i) => i.url)
  const list = urls.length ? urls : [current]
  uni.previewImage({ current, urls: list })
}
</script>

<template>
  <view class="detail-page">
    <scroll-view scroll-y class="detail-scroll">
      <!-- 头图 -->
      <view class="hero">
        <image class="hero-img" :src="heroUrl" mode="aspectFill" />
        <view class="hero-nav" :style="overlayNavStyle">
          <view class="hero-btn" @click="goBack">
            <Icon name="chevron-left" color="#FFFFFF" :weight="2" size="36rpx" />
          </view>
          <view class="hero-btn">
            <Icon name="dots" color="#FFFFFF" :weight="2.6" size="34rpx" />
          </view>
        </view>
      </view>

      <!-- 内容卡片 -->
      <view class="content-card">
        <text class="cc-tag">{{ dateTag }}</text>
        <text class="cc-title">{{ journal ? journal.title : '游记不存在' }}</text>
        <view v-if="journal && journal.locationName" class="cc-loc">
          <Icon name="pin" color="#6B756F" :weight="1.6" size="30rpx" />
          <text>{{ journal.locationName }}</text>
        </view>
        <view v-if="journal && journal.weather" class="cc-weather">
          <Icon name="sun" color="#D9822B" :weight="1.6" size="30rpx" />
          <text>{{ journal.weather }}</text>
        </view>

        <view class="cc-divider" />

        <text v-for="(p, i) in paragraphs" :key="i" class="cc-body">{{ p }}</text>

        <view v-if="gallery.length" class="gallery-header">
          <text class="gh-title">旅途影像</text>
          <text class="gh-count">共 {{ gallery.length }} 张</text>
        </view>
        <view v-if="gallery.length" class="gallery">
          <view v-for="(g, i) in gallery" :key="i" class="gallery-item" @click="previewImage(g)">
            <image class="gallery-img" :src="g" mode="aspectFill" />
          </view>
        </view>

        <view v-if="!loading && !journal" class="detail-empty">
          <text>这篇游记不存在或已被删除</text>
        </view>
      </view>
    </scroll-view>
  </view>
</template>

<style lang="scss" scoped>
.detail-page { min-height: 100vh; background: #fff; }
.detail-scroll { height: 100vh; }

.detail-empty {
  padding: 80rpx 0;
  display: flex;
  justify-content: center;
  font-size: 26rpx;
  color: #a9b5ac;
}

.hero {
  position: relative;
  height: 716rpx;
  background: #cdd9d2;
  .hero-img {
    width: 100%;
    height: 100%;
    display: block;
  }
  .hero-nav {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    padding: 0 32rpx;
    display: flex;
    justify-content: space-between;
    .hero-btn {
      width: 72rpx;
      height: 72rpx;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.26);
      display: flex;
      align-items: center;
      justify-content: center;
    }
  }
}

.content-card {
  margin-top: -40rpx;
  position: relative;
  background: #f5f6f5;
  border-radius: 40rpx 40rpx 0 0;
  padding: 44rpx 56rpx 60rpx;
  display: flex;
  flex-direction: column;
  .cc-tag { font-size: 22rpx; color: #b0b0b0; letter-spacing: 3rpx; }
  .cc-title {
    margin-top: 16rpx;
    font-size: 52rpx;
    font-weight: 700;
    color: #1a2e2a;
    font-family: 'Noto Serif SC', 'Songti SC', serif;
    letter-spacing: 1rpx;
  }
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
    gap: 14rpx;
    .gallery-item {
      flex: 1;
      height: 200rpx;
      border-radius: 16rpx;
      overflow: hidden;
      background: #e8f0ea;
    }
    .gallery-img { width: 100%; height: 100%; display: block; }
  }
}
</style>
