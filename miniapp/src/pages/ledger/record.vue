<script setup lang="ts">
import { computed, ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import Icon from '@/components/Icon.vue'
import { statusBarStyle } from '@/utils/safe-area'
import { useAppStore } from '@/stores/app'
import { useLedgerStore } from '@/stores/ledger'
import { billApi } from '@/api/ledger'

const appStore = useAppStore()
const ledgerStore = useLedgerStore()

const billType = ref<'expense' | 'income'>('expense')
const amount = ref('')
const category = ref('餐饮')
const remark = ref('')
const payWay = ref('微信支付')

const ledgerId = ref('')
/** 账单日期，默认今天 */
const billDate = ref(new Date().toISOString().slice(0, 10))
const submitting = ref(false)

/** 日期展示：10月5日 周二 */
const dateText = computed(() => {
  if (!billDate.value) return '选择日期'
  const d = new Date(billDate.value.replace(/-/g, '/'))
  const week = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][d.getDay()]
  return `${d.getMonth() + 1}月${d.getDate()}日 ${week}`
})

/** 账本名（表单里展示归属） */
const bookName = computed(() => {
  const l = ledgerStore.ledgers.find((x) => x.id === ledgerId.value) || ledgerStore.current
  return l?.name || '账本'
})

interface Cat {
  name: string
  /** 选中态实色 / 图标色 */
  color: string
  /** 未选中圆底 */
  soft: string
  icon: string
}

// 与画板一致：选中＝实色圆＋白色图标，未选中＝浅底＋同色系图标
const categories: Cat[] = [
  { name: '餐饮', color: '#D9822B', soft: '#FBEEE0', icon: 'bowl' },
  { name: '交通', color: '#4A7BC7', soft: '#EAF1FF', icon: 'send' },
  { name: '住宿', color: '#C8577E', soft: '#FCECF4', icon: 'house' },
  { name: '门票', color: '#796AC7', soft: '#F0EBFB', icon: 'triangle' },
  { name: '购物', color: '#5C8A72', soft: '#ECF4EE', icon: 'bag' },
  { name: '其他', color: '#6A746F', soft: '#F0F3F0', icon: 'dots' }
]

const activeCat = computed(() => categories.find((c) => c.name === category.value) || categories[0])

onLoad(async (query: any) => {
  await appStore.init()
  await appStore.ensureLogin()
  await ledgerStore.load()
  ledgerId.value = query?.ledgerId || ledgerStore.current?.id || ''
})

function goBack() {
  uni.navigateBack()
}

function onDateChange(e: any) {
  billDate.value = e.detail.value
}

async function save() {
  if (submitting.value) return
  const value = Number(amount.value)
  if (!ledgerId.value) {
    uni.showToast({ title: '请先选择账本', icon: 'none' })
    return
  }
  if (!value || value <= 0) {
    uni.showToast({ title: '请输入正确金额', icon: 'none' })
    return
  }

  submitting.value = true
  uni.showLoading({ title: '保存中', mask: true })
  try {
    await billApi.create({
      ledgerId: ledgerId.value,
      category: category.value,
      billType: billType.value,
      amount: value,
      remark: remark.value.trim() || undefined,
      payWay: payWay.value || undefined,
      billDate: billDate.value
    })
    uni.hideLoading()
    uni.showToast({ title: '保存成功', icon: 'success' })
    setTimeout(() => uni.navigateBack(), 700)
  } catch (e: any) {
    uni.hideLoading()
    if (!e?.message) uni.showToast({ title: '保存失败，请重试', icon: 'none' })
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <view class="record-page">
    <view class="status-bar" :style="statusBarStyle" />

    <!-- 导航 -->
    <view class="nav">
      <view class="nav-back" @click="goBack">
        <Icon name="chevron-left" color="#1A2E2A" size="40rpx" />
      </view>
      <text class="nav-title">记一笔</text>
    </view>

    <scroll-view scroll-y class="scroll">
      <!-- 支出 / 收入 -->
      <view class="toggle">
        <view class="toggle-item" :class="{ active: billType === 'expense' }" @click="billType = 'expense'">支出</view>
        <view class="toggle-item" :class="{ active: billType === 'income' }" @click="billType = 'income'">收入</view>
      </view>

      <!-- 金额 -->
      <view class="card amount-card">
        <view class="amount-head">
          <text class="amount-label">金额</text>
          <text class="amount-cny">CNY</text>
        </view>
        <view class="amount-value">
          <text class="amount-symbol" :style="{ color: activeCat.color }">¥</text>
          <text class="amount-num">{{ amount }}</text>
        </view>
      </view>

      <!-- 分类 -->
      <view class="card cat-card">
        <text class="card-title">选择分类</text>
        <view class="cat-grid">
          <view
            v-for="c in categories"
            :key="c.name"
            class="cat-item"
            @click="category = c.name"
          >
            <view
              class="cat-icon"
              :style="{ background: category === c.name ? c.color : c.soft }"
            >
              <Icon
                :name="c.icon"
                :color="category === c.name ? '#FFFFFF' : c.color"
                :weight="1.7"
                size="44rpx"
              />
            </view>
            <text class="cat-name" :class="{ active: category === c.name }">
              {{ c.name }}
            </text>
          </view>
        </view>
      </view>

      <!-- 账单信息 -->
      <view class="card form-card">
        <view class="form-row">
          <text class="form-label">日期</text>
          <picker mode="date" :value="billDate" @change="onDateChange">
            <view class="form-value-wrap">
              <text class="form-value">{{ dateText }}</text>
              <Icon name="chevron-down" color="#C4CCC6" size="28rpx" />
            </view>
          </picker>
        </view>
        <view class="form-line" />
        <view class="form-row">
          <text class="form-label">所属账本</text>
          <view class="form-value-wrap">
            <text class="form-value">{{ bookName }}</text>
          </view>
        </view>
        <view class="form-line" />
        <view class="form-row">
          <text class="form-label">备注</text>
          <input
            v-model="remark"
            class="form-input"
            maxlength="30"
            placeholder="添加备注（选填）"
            placeholder-style="color:#C4CCC6"
          />
        </view>
        <view class="form-line" />
        <view class="form-row">
          <text class="form-label">付款方式</text>
          <view class="form-value-wrap">
            <text class="form-value">{{ payWay }}</text>
            <Icon name="chevron-down" color="#C4CCC6" size="28rpx" />
          </view>
        </view>
      </view>

      <text class="tip">保存后自动计入「{{ bookName }}」</text>

      <button class="save-btn" @click="save">保存账单</button>
      <view class="bottom-space" />
    </scroll-view>
  </view>
</template>

<style lang="scss" scoped>
/* 高度由 utils/safe-area.ts 按机型注入 */
.status-bar {
  width: 100%;
}

.record-page {
  min-height: 100vh;
  background: #f5f7f5;
  display: flex;
  flex-direction: column;
}

/* 导航 */
.nav {
  display: flex;
  align-items: center;
  gap: 8rpx;
  height: 104rpx;
  padding: 0 32rpx;
  flex-shrink: 0;
  .nav-back {
    width: 64rpx;
    height: 64rpx;
    display: flex;
    align-items: center;
    justify-content: flex-start;
  }
  .ico { width: 40rpx; height: 40rpx; }
  .nav-title {
    font-size: 34rpx;
    font-weight: 600;
    color: #1a2e2a;
    letter-spacing: 0.4rpx;
  }
}

.scroll {
  flex: 1;
  padding: 0 32rpx;
}

.card {
  background: #fff;
  border-radius: 32rpx;
}

/* 支出 / 收入 */
.toggle {
  display: flex;
  height: 96rpx;
  padding: 6rpx;
  background: #fff;
  border-radius: 48rpx;
  margin-top: 12rpx;
  .toggle-item {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 42rpx;
    font-size: 28rpx;
    color: #6b756f;
    &.active {
      background: #2e9e6b;
      color: #fff;
      font-weight: 600;
    }
  }
}

/* 金额 */
.amount-card {
  margin-top: 32rpx;
  padding: 36rpx 40rpx 32rpx;
  .amount-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  .amount-label {
    font-size: 24rpx;
    color: #9aa39d;
  }
  .amount-cny {
    font-size: 20rpx;
    color: #c4ccc6;
    letter-spacing: 2rpx;
  }
  .amount-value {
    display: flex;
    align-items: flex-end;
    gap: 6rpx;
    margin-top: 10rpx;
  }
  .amount-symbol {
    font-size: 48rpx;
    font-weight: 500;
    line-height: 1.1;
    padding-bottom: 8rpx;
  }
  .amount-num {
    font-size: 88rpx;
    font-weight: 700;
    color: #1a2e2a;
    line-height: 1;
    letter-spacing: -1rpx;
  }
}

/* 分类 */
.cat-card {
  margin-top: 28rpx;
  padding: 36rpx 40rpx 32rpx;
  .card-title {
    font-size: 26rpx;
    font-weight: 600;
    color: #1a2e2a;
  }
  .cat-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    row-gap: 30rpx;
    margin-top: 28rpx;
  }
  .cat-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 14rpx;
  }
  .cat-icon {
    width: 88rpx;
    height: 88rpx;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    box-sizing: border-box;
  }
  .cat-svg {
    width: 40rpx;
    height: 40rpx;
  }
  .cat-name {
    font-size: 22rpx;
    color: #6b756f;
    &.active {
      color: #1a2e2a;
      font-weight: 600;
    }
  }
}

/* 表单 */
.form-card {
  margin-top: 28rpx;
  padding: 0 40rpx;
  .form-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: 96rpx;

    /* picker 撑满右侧剩余空间，保持右对齐 */
    picker {
      flex: 1;
      display: flex;
      justify-content: flex-end;
    }
  }
  .form-label {
    font-size: 26rpx;
    color: #6b756f;
    flex-shrink: 0;
  }
  .form-value-wrap {
    display: flex;
    align-items: center;
    gap: 6rpx;
  }
  .form-value {
    font-size: 26rpx;
    font-weight: 500;
    color: #1a2e2a;
  }
  .form-input {
    flex: 1;
    text-align: right;
    font-size: 26rpx;
    color: #1a2e2a;
  }
  .chev {
    width: 28rpx;
    height: 28rpx;
  }
  .form-line {
    height: 1rpx;
    background: #f0f3f1;
  }
}

.tip {
  display: block;
  margin-top: 24rpx;
  padding-left: 4rpx;
  font-size: 22rpx;
  color: #9aa39d;
}

.save-btn {
  margin-top: 28rpx;
  width: 100%;
  height: 104rpx;
  line-height: 104rpx;
  border-radius: 52rpx;
  background: #2e9e6b;
  color: #fff;
  font-size: 30rpx;
  font-weight: 600;
  border: none;
  &::after {
    border: none;
  }
}

.bottom-space {
  height: 48rpx;
}
</style>
