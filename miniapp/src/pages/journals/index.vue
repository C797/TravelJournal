<script setup lang="ts">
import { ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import TabBar from '@/components/TabBar.vue'
import { mockJournals } from '@/mock'
import { formatDate } from '@/utils'

const activeCategory = ref('全部')
const categories = ref(['全部', '川西之旅', '云南', '厦门'])
const journals = ref(mockJournals)
const favorites = ref<Record<string, boolean>>({})

onLoad(() => {})

function goEdit() {
  uni.navigateTo({ url: '/pages/journals/edit' })
}

function goDetail(id: string) {
  uni.navigateTo({ url: `/pages/journals/detail?id=${id}` })
}

function toggleFav(id: string) {
  favorites.value[id] = !favorites.value[id]
}

function onQuick() {
  uni.navigateTo({ url: '/pages/journals/edit' })
}
</script>

<template>
  <view class="tj-page journals-page">
    <view class="status-bar"><text class="time">9:41</text></view>

    <view class="header">
      <view class="header-top">
        <text class="title">我的游记</text>
        <view class="new-btn" @click="goEdit"><text class="plus">＋</text><text>新建</text></view>
      </view>
      <text class="en-sub">MEMORIES</text>
      <text class="sub-title">把旅途写成自己的章节</text>
    </view>

    <!-- 分类标签 -->
    <scroll-view scroll-x class="category-bar">
      <view
        v-for="c in categories"
        :key="c"
        class="category-tag"
        :class="{ active: activeCategory === c }"
        @click="activeCategory = c"
      >{{ c }}</view>
    </scroll-view>

    <!-- 游记列表 -->
    <view
      v-for="j in journals"
      :key="j.id"
      class="journal-card tj-card"
      @click="goDetail(j.id)"
    >
      <view class="jc-thumb"><text>🏔️</text></view>
      <view class="jc-info">
        <text class="jc-title">{{ j.title }}</text>
        <text class="jc-loc">{{ j.locationName }}</text>
        <text class="jc-date">{{ formatDate(j.travelDate) }} · 6 张照片</text>
      </view>
      <text class="jc-fav" :class="{ faved: favorites[j.id] }" @click.stop="toggleFav(j.id)">
        {{ favorites[j.id] ? '♥' : '♡' }}
      </text>
    </view>

    <TabBar active="books" @quick="onQuick" />
  </view>
</template>

<style lang="scss" scoped>
.journals-page { padding: 0 32rpx 160rpx; }
.status-bar { height: 60rpx; display: flex; align-items: center; .time { font-weight: 700; font-size: 30rpx; } }

.header {
  margin-top: 16rpx;
  .header-top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    .title { font-size: 48rpx; font-weight: 800; }
    .new-btn {
      display: flex;
      align-items: center;
      gap: 6rpx;
      padding: 12rpx 28rpx;
      border-radius: 999rpx;
      background: #2e8b57;
      color: #fff;
      font-size: 26rpx;
      .plus { font-size: 28rpx; }
    }
  }
  .en-sub { display: block; margin-top: 8rpx; font-size: 22rpx; letter-spacing: 4rpx; color: #a9b5ac; }
  .sub-title { display: block; margin-top: 8rpx; font-size: 36rpx; font-weight: 700; }
}

.category-bar {
  margin-top: 32rpx;
  white-space: nowrap;
  .category-tag {
    display: inline-flex;
    padding: 14rpx 36rpx;
    border-radius: 999rpx;
    background: #fff;
    font-size: 26rpx;
    margin-right: 16rpx;
    &.active { background: #2e8b57; color: #fff; font-weight: 600; }
  }
}

.journal-card {
  margin-top: 24rpx;
  display: flex;
  align-items: center;
  padding: 24rpx;
  box-shadow: 0 2rpx 16rpx rgba(0,0,0,0.04);
  .jc-thumb {
    width: 130rpx;
    height: 130rpx;
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
    .jc-loc { font-size: 22rpx; color: #9aa79d; }
    .jc-date { font-size: 22rpx; color: #a9b5ac; }
  }
  .jc-fav { font-size: 44rpx; color: #ccc; margin-left: 12rpx; &.faved { color: #e8833a; } }
}
</style>
