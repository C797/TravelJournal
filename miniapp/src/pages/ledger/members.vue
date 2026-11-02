<script setup lang="ts">
import { ref, computed } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { ledgerApi } from '@/api/ledger'
import { useLedgerStore } from '@/stores/ledger'
import { useAppStore } from '@/stores/app'
import Icon from '@/components/Icon.vue'
import { statusBarStyle } from '@/utils/safe-area'
import type { LedgerMember } from '@/types'

const ledgerStore = useLedgerStore()
const appStore = useAppStore()

const ledgerId = ref('')
const members = ref<LedgerMember[]>([])
const loading = ref(true)

const roleMap: Record<string, string> = {
  creator: '创建者',
  admin: '管理员',
  member: '成员'
}

const avatarStyles = [
  { bg: '#EAF3EC', fg: '#2E9E6B' },
  { bg: '#FBF0E4', fg: '#C08A52' },
  { bg: '#EBEEFB', fg: '#5C79C4' }
]

/** 当前账本名，用于副标题 */
const ledgerName = computed(() => {
  const l = ledgerStore.ledgers.find((x) => x.id === ledgerId.value)
  return l?.name || ledgerStore.current?.name || '账本'
})

/** 是否是创建者（可移除成员） */
const isOwner = computed(() => {
  const l = ledgerStore.ledgers.find((x) => x.id === ledgerId.value) || ledgerStore.current
  return !!l && !!appStore.user && l.ownerId === appStore.user.id
})

async function loadData() {
  loading.value = true
  try {
    await appStore.init()
    await appStore.ensureLogin()
    await ledgerStore.load()
    if (!ledgerId.value) ledgerId.value = ledgerStore.current?.id || ''
    if (ledgerId.value) {
      members.value = await ledgerApi.members(ledgerId.value).catch(() => [] as LedgerMember[])
    }
  } finally {
    loading.value = false
  }
}

onLoad((query: any) => {
  ledgerId.value = query?.ledgerId || ''
  loadData()
})

function goBack() {
  uni.navigateBack()
}

function goInvite() {
  uni.navigateTo({ url: `/pages/ledger/invite?ledgerId=${ledgerId.value}` })
}

/** 移除成员（仅创建者可见） */
function removeMember(m: LedgerMember) {
  if (m.role === 'creator') {
    uni.showToast({ title: '不能移除创建者', icon: 'none' })
    return
  }
  const nickname = m.user?.nickname || '该成员'
  uni.showModal({
    title: '移除成员',
    content: `确定将「${nickname}」移出该账本吗？`,
    confirmColor: '#E2607E',
    success: async (res) => {
      if (!res.confirm) return
      try {
        await ledgerApi.removeMember(ledgerId.value, m.userId)
        members.value = members.value.filter((x) => x.id !== m.id)
        uni.showToast({ title: '已移除', icon: 'success' })
      } catch {
        // request 层已提示
      }
    }
  })
}

/** 加入日期格式化：2025-06-01 → 2025.06.01 */
function joinDate(d: string) {
  return d ? String(d).slice(0, 10).replace(/-/g, '.') : ''
}
</script>

<template>
  <view class="members-page">
    <view class="status-bar" :style="statusBarStyle" />

    <!-- 裸返回箭头（无导航栏） -->
    <view class="back-row" @click="goBack">
      <Icon name="chevron-left" color="#1A2E2A" size="40rpx" />
    </view>

    <scroll-view scroll-y class="scroll">
      <!-- 标题区 -->
      <view class="head">
        <text class="head-title">一起记录，共享每一笔旅费</text>
        <text class="head-sub">{{ ledgerName }} · 共同记录每一笔</text>
      </view>

      <!-- 成员列表 -->
      <view class="list-head">
        <text class="lh-title">成员列表</text>
        <text class="lh-count">{{ members.length }} 人</text>
      </view>

      <view class="member-list">
        <view v-for="(m, i) in members" :key="m.id" class="member-row" @longpress="isOwner && removeMember(m)">
          <view class="m-avatar" :style="{ background: avatarStyles[i % 3].bg }">
            <image
              v-if="m.user?.avatar"
              class="m-avatar-img"
              :src="m.user.avatar"
              mode="aspectFill"
            />
            <text v-else class="m-avatar-txt" :style="{ color: avatarStyles[i % 3].fg }">
              {{ (m.user?.nickname || '旅').slice(0, 1) }}
            </text>
          </view>
          <view class="m-info">
            <text class="m-name">{{ m.user?.nickname || '未设置昵称' }}</text>
            <text class="m-date">加入于 {{ joinDate(m.joinedAt) }}</text>
          </view>
          <text class="m-role">{{ roleMap[m.role] }}</text>
          <view v-if="i < members.length - 1" class="m-line" />
        </view>

        <view v-if="!loading && !members.length" class="member-empty">
          <text>还没有成员，去邀请好友一起记账</text>
        </view>
      </view>

      <!-- 权限说明 -->
      <view class="perm">
        <text class="perm-title">成员权限</text>
        <text class="perm-desc">创建者可管理账本与成员；管理员可协助维护账单，成员可共同记录收支。</text>
      </view>
    </scroll-view>

    <view class="footer">
      <view class="invite-btn" @click="goInvite">
        <Icon name="plus" color="#FFFFFF" :weight="1.9" size="32rpx" />
        <text class="invite-txt">邀请新成员</text>
      </view>
    </view>
  </view>
</template>

<style lang="scss" scoped>
/* 高度由 utils/safe-area.ts 按机型注入 */
.status-bar {
  width: 100%;
}

.members-page {
  min-height: 100vh;
  background: #f5f7f5;
  display: flex;
  flex-direction: column;
}

.back-row {
  height: 80rpx;
  padding: 0 32rpx;
  display: flex;
  align-items: center;
  .back-ico {
    width: 40rpx;
    height: 40rpx;
  }
}

.scroll {
  flex: 1;
  padding: 0 32rpx;
}

/* 标题区 */
.head {
  padding: 16rpx 0 8rpx;
  .head-title {
    display: block;
    font-family: 'Songti SC', 'Noto Serif SC', serif;
    font-size: 50rpx;
    font-weight: 700;
    color: #1a2e2a;
    line-height: 1.32;
    letter-spacing: 0.4rpx;
  }
  .head-sub {
    display: block;
    margin-top: 14rpx;
    font-size: 22rpx;
    color: #9aa39d;
  }
}

/* 列表 */
.list-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: 40rpx 0 4rpx;
  .lh-title {
    font-size: 26rpx;
    font-weight: 600;
    color: #1a2e2a;
  }
  .lh-count {
    font-size: 22rpx;
    color: #9aa39d;
  }
}

.member-list {
  margin-top: 8rpx;
}

.member-row {
  position: relative;
  display: flex;
  align-items: center;
  height: 160rpx;
}

.m-avatar {
  width: 88rpx;
  height: 88rpx;
  border-radius: 44rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  .m-avatar-txt {
    font-family: 'Songti SC', 'Noto Serif SC', serif;
    font-size: 34rpx;
    font-weight: 600;
  }
}

.m-info {
  margin-left: 24rpx;
  display: flex;
  flex-direction: column;
  gap: 6rpx;
  .m-name {
    font-size: 28rpx;
    font-weight: 600;
    color: #1a2e2a;
  }
  .m-date {
    font-size: 22rpx;
    color: #9aa39d;
  }
}

.m-role {
  margin-left: auto;
  font-size: 22rpx;
  color: #b0b8b2;
}

.m-line {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 1rpx;
  background: #eaeeeb;
}

/* 权限 */
.perm {
  margin-top: 44rpx;
  background: #f0f7f2;
  border-radius: 24rpx;
  padding: 32rpx;
  .perm-title {
    display: block;
    font-size: 24rpx;
    font-weight: 600;
    color: #1a2e2a;
  }
  .perm-desc {
    display: block;
    margin-top: 12rpx;
    font-size: 22rpx;
    color: #6b756f;
    line-height: 1.7;
  }
}

/* 底部按钮 */
.footer {
  padding: 24rpx 32rpx 48rpx;
}
.invite-btn {
  height: 104rpx;
  border-radius: 52rpx;
  background: #2e9e6b;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8rpx;
  .plus {
    width: 32rpx;
    height: 32rpx;
  }
  .invite-txt {
    font-size: 30rpx;
    font-weight: 600;
    color: #ffffff;
  }
}
</style>
