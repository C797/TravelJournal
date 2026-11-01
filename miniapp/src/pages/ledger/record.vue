<script setup lang="ts">
import { ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'

const billType = ref<'expense' | 'income'>('expense')
const amount = ref('86.00')
const category = ref('餐饮')
const date = ref('10月5日 周二')
const book = ref('川西之旅')
const remark = ref('藏式火锅')
const payWay = ref('微信支付')

const categories = [
  { name: '餐饮', icon: '🍲', bg: '#E08A2E' },
  { name: '交通', icon: '✈️', bg: '#E3ECFA' },
  { name: '住宿', icon: '🏠', bg: '#FBE3EA' },
  { name: '门票', icon: '🎫', bg: '#EAE6FA' },
  { name: '购物', icon: '🛍️', bg: '#DFF0E4' },
  { name: '其他', icon: '···', bg: '#EFEFEF' }
]

onLoad(() => {})

function goBack() {
  uni.navigateBack()
}

function save() {
  uni.showToast({ title: '保存成功', icon: 'success' })
  setTimeout(() => uni.navigateBack(), 800)
}
</script>

<template>
  <view class="record-page">
    <view class="tj-nav">
      <text class="tj-nav-back" @click="goBack">‹</text>
      <text class="tj-nav-title">记一笔</text>
    </view>

    <scroll-view scroll-y class="record-scroll">
      <!-- 支出/收入切换 -->
      <view class="type-toggle">
        <view class="tt-option" :class="{ active: billType === 'expense' }" @click="billType = 'expense'">支出</view>
        <view class="tt-option" :class="{ active: billType === 'income' }" @click="billType = 'income'">收入</view>
      </view>

      <!-- 金额 -->
      <view class="amount-card tj-card">
        <view class="amount-header">
          <text class="ah-label">金额</text>
          <text class="ah-cny">CNY</text>
        </view>
        <view class="amount-value">
          <text class="av-symbol">¥</text>
          <text class="av-num">{{ amount }}</text>
        </view>
      </view>

      <!-- 选择分类 -->
      <view class="category-card tj-card">
        <text class="cc-title">选择分类</text>
        <view class="category-grid">
          <view
            v-for="c in categories"
            :key="c.name"
            class="category-item"
            :class="{ active: category === c.name }"
            @click="category = c.name"
          >
            <view class="ci-icon" :style="{ background: c.bg }">
              <text>{{ c.icon }}</text>
            </view>
            <text class="ci-name" :class="{ active: category === c.name }">{{ c.name }}</text>
          </view>
        </view>
      </view>

      <!-- 表单信息 -->
      <view class="form-card tj-card">
        <view class="form-row">
          <text class="fr-label">日期</text>
          <text class="fr-value">{{ date }} ⌄</text>
        </view>
        <view class="form-divider" />
        <view class="form-row">
          <text class="fr-label">所属旅行册</text>
          <text class="fr-value">{{ book }} ⌄</text>
        </view>
        <view class="form-divider" />
        <view class="form-row">
          <text class="fr-label">备注</text>
          <text class="fr-value">{{ remark }}</text>
        </view>
        <view class="form-divider" />
        <view class="form-row">
          <text class="fr-label">付款方式</text>
          <text class="fr-value">{{ payWay }} ⌄</text>
        </view>
      </view>

      <text class="tip-text">保存后自动计入「川西之旅」旅行册账本</text>
      <button class="tj-btn-primary save-btn" @click="save">保存账单</button>
      <view class="bottom-space" />
    </scroll-view>
  </view>
</template>

<style lang="scss" scoped>
.record-page {
  min-height: 100vh;
  background: #f2f3f5;
  display: flex;
  flex-direction: column;
}
.record-scroll { flex: 1; padding: 0 32rpx; }

.type-toggle {
  display: flex;
  background: #fff;
  border-radius: 999rpx;
  padding: 6rpx;
  margin-top: 16rpx;
  .tt-option {
    flex: 1;
    height: 68rpx;
    border-radius: 999rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 28rpx;
    &.active { background: #34a853; color: #fff; font-weight: 600; }
  }
}

.amount-card {
  margin-top: 24rpx;
  padding: 32rpx;
  .amount-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    .ah-label { font-size: 24rpx; color: #999; }
    .ah-cny { font-size: 24rpx; color: #999; }
  }
  .amount-value {
    display: flex;
    align-items: baseline;
    margin-top: 16rpx;
    .av-symbol { font-size: 48rpx; color: #34a853; font-weight: 600; }
    .av-num { font-size: 96rpx; font-weight: 700; margin-left: 8rpx; }
  }
}

.category-card {
  margin-top: 24rpx;
  padding: 28rpx;
  .cc-title { font-size: 30rpx; font-weight: 700; }
  .category-grid {
    margin-top: 24rpx;
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 32rpx;
    .category-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 12rpx;
      .ci-icon {
        width: 96rpx;
        height: 96rpx;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 44rpx;
      }
      .ci-name { font-size: 26rpx; color: #555; &.active { color: #e08a2e; font-weight: 700; } }
    }
  }
}

.form-card {
  margin-top: 24rpx;
  padding: 0 28rpx;
  .form-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 30rpx 0;
    .fr-label { font-size: 28rpx; color: #999; }
    .fr-value { font-size: 28rpx; font-weight: 600; }
  }
  .form-divider { height: 1rpx; background: #f0f0f0; }
}

.tip-text {
  display: block;
  text-align: center;
  margin-top: 32rpx;
  font-size: 22rpx;
  color: #999;
}
.save-btn { margin-top: 24rpx; width: 100%; }
.bottom-space { height: 60rpx; }
</style>
