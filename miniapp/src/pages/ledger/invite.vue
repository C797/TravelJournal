<script setup lang="ts">
import { ref, computed } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { invitationApi } from '@/api/ledger'
import { useLedgerStore } from '@/stores/ledger'
import { useAppStore } from '@/stores/app'
import Icon from '@/components/Icon.vue'
import { statusBarStyle } from '@/utils/safe-area'
import type { Invitation } from '@/types'

const ledgerStore = useLedgerStore()
const appStore = useAppStore()

const ledgerId = ref('')
const invitation = ref<Invitation | null>(null)
const generating = ref(true)

/** 当前账本名，用于邀请说明文案 */
const ledgerName = computed(() => {
  const l = ledgerStore.ledgers.find((x) => x.id === ledgerId.value)
  return l?.name || ledgerStore.current?.name || '共同'
})

/** 有效期展示：2025-06-20T23:59:00Z → 2025.06.20 23:59 */
const expireText = computed(() => {
  const d = invitation.value?.expireAt
  if (!d) return '—'
  const t = new Date(d)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${t.getFullYear()}.${pad(t.getMonth() + 1)}.${pad(t.getDate())} ${pad(t.getHours())}:${pad(t.getMinutes())}`
})

async function loadData() {
  generating.value = true
  try {
    await appStore.init()
    await appStore.ensureLogin()
    await ledgerStore.load()
    if (!ledgerId.value) ledgerId.value = ledgerStore.current?.id || ''
    if (ledgerId.value) {
      // 每次进入生成新邀请码，7 天有效
      invitation.value = await invitationApi.generate(ledgerId.value, 168)
    }
  } catch {
    // request 层已提示（非创建者会提示无权限）
  } finally {
    generating.value = false
  }
}

onLoad((query: any) => {
  ledgerId.value = query?.ledgerId || ''
  loadData()
})

function goBack() {
  uni.navigateBack()
}

function copyCode() {
  if (!invitation.value?.code) return
  uni.setClipboardData({
    data: invitation.value.code,
    success: () => uni.showToast({ title: '邀请码已复制', icon: 'success' })
  })
}

function share() {
  uni.showToast({ title: '长按右上角「···」可转发给好友', icon: 'none' })
}
</script>

<template>
  <view class="invite-page">
    <view class="status-bar" :style="statusBarStyle" />

    <!-- 导航 -->
    <view class="nav">
      <view class="nav-back" @click="goBack">
        <Icon name="chevron-left" color="#1A2E2A" size="40rpx" />
      </view>
      <text class="nav-title">邀请好友</text>
      <view class="nav-more"><text class="nav-more-dot">···</text></view>
    </view>

    <scroll-view scroll-y class="scroll">
      <!-- 标题 -->
      <view class="head">
        <text class="head-title">让旅程中的每个人</text>
        <text class="head-title">都能一起记录。</text>
        <text class="head-sub">邀请好友加入「{{ ledgerName }}」共同账本</text>
      </view>

      <!-- 邀请码 -->
      <view class="code-card">
        <text class="code-label">INVITATION CODE</text>
        <text class="code-value">{{ generating ? '生成中…' : invitation ? invitation.code : '——' }}</text>

        <view class="code-divider" />

        <text class="expire-label">有效期至</text>
        <text class="expire-value">{{ expireText }}</text>
        <text class="code-desc">好友输入邀请码，即可加入同一账本</text>

        <view class="copy-btn" @click="copyCode">
          <text class="copy-txt">复制邀请码</text>
        </view>
      </view>

      <!-- 邀请方式 -->
      <view class="method-block">
        <text class="method-title">邀请方式</text>
        <view class="method-card">
          <view class="mc-icon"><text class="mc-icon-txt">微</text></view>
          <view class="mc-info">
            <text class="mc-name">发送给微信好友</text>
            <text class="mc-desc">通过微信会话分享邀请信息</text>
          </view>
          <Icon class="mc-arrow" name="chevron-right" color="#C4CCC6" size="32rpx" />
        </view>
      </view>

      <text class="warn">温馨提示：邀请码仅可使用一次，请分享给本次旅程的同行伙伴。</text>

      <view class="share-btn" @click="share">
        <text class="share-txt">分享邀请</text>
      </view>
      <view class="bottom-space" />
    </scroll-view>
  </view>
</template>

<style lang="scss" scoped>
/* 高度由 utils/safe-area.ts 按机型注入 */
.status-bar {
  width: 100%;
}

.invite-page {
  min-height: 100vh;
  background: #f5f7f5;
  display: flex;
  flex-direction: column;
}

/* 导航 */
.nav {
  display: flex;
  align-items: center;
  height: 104rpx;
  padding: 0 32rpx;
  flex-shrink: 0;
  .nav-back {
    width: 48rpx;
    height: 64rpx;
    display: flex;
    align-items: center;
  }
  .ico {
    width: 40rpx;
    height: 40rpx;
  }
  .nav-title {
    font-size: 34rpx;
    font-weight: 600;
    color: #1a2e2a;
    letter-spacing: 0.4rpx;
  }
  .nav-more {
    margin-left: auto;
    width: 112rpx;
    height: 64rpx;
    border-radius: 32rpx;
    background: #ffffff;
    display: flex;
    align-items: center;
    justify-content: center;
    .nav-more-dot {
      font-size: 28rpx;
      color: #4a5752;
      letter-spacing: 2rpx;
      line-height: 1;
    }
  }
}

.scroll {
  flex: 1;
  padding: 0 32rpx;
}

/* 标题 */
.head {
  padding: 24rpx 0 8rpx;
  display: flex;
  flex-direction: column;
  .head-title {
    font-family: 'Songti SC', 'Noto Serif SC', serif;
    font-size: 50rpx;
    font-weight: 700;
    color: #1a2e2a;
    line-height: 1.34;
    letter-spacing: 0.4rpx;
  }
  .head-sub {
    margin-top: 16rpx;
    font-size: 22rpx;
    color: #9aa39d;
  }
}

/* 邀请码卡片 */
.code-card {
  margin-top: 32rpx;
  background: #234b3a;
  border-radius: 40rpx;
  padding: 44rpx 40rpx 32rpx;
}
.code-label {
  font-size: 20rpx;
  color: #9db8a5;
  letter-spacing: 4rpx;
}
.code-value {
  display: block;
  margin-top: 18rpx;
  font-family: 'Songti SC', 'Noto Serif SC', serif;
  font-size: 68rpx;
  font-weight: 600;
  color: #f7f4ec;
  letter-spacing: 8rpx;
  line-height: 1.1;
}
.code-divider {
  height: 1rpx;
  background: rgba(255, 255, 255, 0.16);
  margin: 28rpx 0 24rpx;
}
.expire-label {
  display: block;
  font-size: 20rpx;
  color: #8aa896;
}
.expire-value {
  display: block;
  margin-top: 8rpx;
  font-size: 26rpx;
  font-weight: 600;
  color: #ffffff;
}
.code-desc {
  display: block;
  margin-top: 16rpx;
  font-size: 22rpx;
  color: #8aa896;
}
.copy-btn {
  margin-top: 28rpx;
  height: 84rpx;
  border-radius: 42rpx;
  background: rgba(255, 255, 255, 0.92);
  display: flex;
  align-items: center;
  justify-content: center;
  .copy-txt {
    font-size: 26rpx;
    font-weight: 600;
    color: #234b3a;
  }
}

/* 邀请方式 */
.method-block {
  margin-top: 40rpx;
  .method-title {
    display: block;
    font-size: 26rpx;
    font-weight: 600;
    color: #1a2e2a;
    padding-left: 4rpx;
    margin-bottom: 16rpx;
  }
}
.method-card {
  background: #ffffff;
  border-radius: 32rpx;
  padding: 24rpx 32rpx;
  display: flex;
  align-items: center;
}
.mc-icon {
  width: 80rpx;
  height: 80rpx;
  border-radius: 40rpx;
  background: #eaf3ec;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  .mc-icon-txt {
    font-size: 28rpx;
    font-weight: 600;
    color: #2e9e6b;
  }
}
.mc-info {
  margin-left: 24rpx;
  display: flex;
  flex-direction: column;
  gap: 6rpx;
  .mc-name {
    font-size: 28rpx;
    font-weight: 600;
    color: #1a2e2a;
  }
  .mc-desc {
    font-size: 22rpx;
    color: #9aa39d;
  }
}
.mc-arrow {
  margin-left: auto;
  width: 32rpx;
  height: 32rpx;
}

.warn {
  display: block;
  margin-top: 120rpx;
  font-size: 20rpx;
  color: #b0b8b2;
  line-height: 1.6;
}

.share-btn {
  margin-top: 20rpx;
  height: 104rpx;
  border-radius: 52rpx;
  background: #2e9e6b;
  display: flex;
  align-items: center;
  justify-content: center;
  .share-txt {
    font-size: 30rpx;
    font-weight: 600;
    color: #ffffff;
  }
}

.bottom-space {
  height: 48rpx;
}
</style>
