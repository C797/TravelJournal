<script setup lang="ts">
import { computed, ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import Icon from '@/components/Icon.vue'
import { useAppStore } from '@/stores/app'
import { useLedgerStore } from '@/stores/ledger'
import { userApi } from '@/api/auth'
import { calcDays } from '@/utils'
import { statusBarStyle } from '@/utils/safe-area'
import type { TravelBook, User } from '@/types'

const appStore = useAppStore()
const ledgerStore = useLedgerStore()

const MAX_NAME = 20

/** 旅行册封面兜底（按索引循环，真实 coverUrl 优先） */
const COVER_FALLBACK = [
  '/static/photos/book-chuanxi.jpg',
  '/static/photos/book-xiamen.jpg',
  '/static/photos/book-yunnan.jpg'
]

/** 头像配色，按索引循环 */
const AVATAR_BG = ['#D6EADD', '#F5E3D0', '#D6DEF0', '#EAD9E8', '#DCE9F5', '#E8E6D2']
const AVATAR_FG = ['#3D8B5F', '#D08A4E', '#5C79C4', '#B0629B', '#4A87B8', '#8C8742']

// ---------- 所属旅行册 ----------
const books = computed<TravelBook[]>(() => appStore.travelBooks)
const bookId = ref('')
const showBookPicker = ref(false)
const selectedBook = computed(() => books.value.find((b) => b.id === bookId.value) || null)

// ---------- 账本名称 ----------
const name = ref('')
/** 用户手动改过名称后，切换旅行册不再自动覆盖 */
const nameTouched = ref(false)
const nameLen = computed(() => name.value.length)

// ---------- 邀请成员 ----------
const friends = ref<User[]>([])
const memberIds = ref<string[]>([])
const showMemberPicker = ref(false)
const selectedMembers = computed(() => friends.value.filter((f) => memberIds.value.includes(f.id)))

// ---------- 是否公开 ----------
const isPublic = ref(false)

const submitting = ref(false)

onLoad(async () => {
  await appStore.init()
  await appStore.ensureLogin()
  await appStore.loadBooks()

  bookId.value = books.value[0]?.id || ''
  syncNameFromBook()

  // 可邀请的人：共同旅行册成员
  friends.value = await userApi.myFriends().catch(() => [] as User[])
})

/** 未手动改名时，名称默认跟随所选旅行册（「川西之旅」→「川西之旅账本」） */
function syncNameFromBook() {
  if (nameTouched.value) return
  const b = selectedBook.value
  if (!b) return
  name.value = `${b.name}账本`
}

function bookCover(id: string) {
  const idx = books.value.findIndex((b) => b.id === id)
  const book = books.value[idx]
  return book?.coverUrl || COVER_FALLBACK[(idx < 0 ? 0 : idx) % COVER_FALLBACK.length]
}

function fmtDate(d?: string) {
  return d ? d.replace(/-/g, '.') : ''
}

/** 「2025.06.01 - 2025.06.15 · 共 15 天」 */
function bookMeta(b: TravelBook | null) {
  if (!b) return ''
  const days = b.tripDays || calcDays(b.startTime, b.endTime) || 0
  return `${fmtDate(b.startTime)} - ${fmtDate(b.endTime)} · 共 ${days} 天`
}

function avatarStyle(i: number) {
  return {
    background: AVATAR_BG[i % AVATAR_BG.length],
    color: AVATAR_FG[i % AVATAR_FG.length]
  }
}

function initial(nickname = '') {
  return nickname.slice(0, 1) || '友'
}

// ---------- 交互 ----------
function toggleBookPicker() {
  showBookPicker.value = !showBookPicker.value
}

function pickBook(id: string) {
  bookId.value = id
  showBookPicker.value = false
  syncNameFromBook()
}

function onNameInput(e: any) {
  nameTouched.value = true
  name.value = (e.detail.value || '').slice(0, MAX_NAME)
}

function toggleMemberPicker() {
  showMemberPicker.value = !showMemberPicker.value
}

function toggleMember(id: string) {
  const i = memberIds.value.indexOf(id)
  if (i >= 0) memberIds.value.splice(i, 1)
  else memberIds.value.push(id)
}

function confirmMembers() {
  showMemberPicker.value = false
}

function onPublicChange(e: any) {
  isPublic.value = !!e.detail.value
}

function goBack() {
  uni.navigateBack()
}

async function create() {
  if (submitting.value) return
  const book = selectedBook.value
  if (!book) {
    uni.showToast({ title: '请选择所属旅行册', icon: 'none' })
    return
  }
  const ledgerName = name.value.trim()
  if (!ledgerName) {
    uni.showToast({ title: '请填写账本名称', icon: 'none' })
    return
  }

  await appStore.ensureLogin()
  submitting.value = true
  uni.showLoading({ title: '创建中', mask: true })

  try {
    await ledgerStore.saveAndSwitch({
      name: ledgerName,
      bookId: book.id,
      isPublic: isPublic.value,
      memberIds: memberIds.value
    })

    uni.hideLoading()
    const memberTip = memberIds.value.length ? `，已邀请 ${memberIds.value.length} 位成员` : ''
    uni.showToast({ title: `创建成功${memberTip}`, icon: 'none' })
    setTimeout(() => uni.navigateBack(), 700)
  } catch (e: any) {
    uni.hideLoading()
    if (!e?.message) uni.showToast({ title: '创建失败，请重试', icon: 'none' })
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <view class="create-page">
    <view class="status-bar" :style="statusBarStyle" />

    <view class="tj-nav">
      <text class="tj-nav-back" @click="goBack">‹</text>
      <text class="tj-nav-title">新建账本</text>
    </view>

    <scroll-view scroll-y class="form-scroll">
      <!-- 所属旅行册 -->
      <view class="field">
        <view class="field-label">
          <text class="label-name">所属旅行册</text>
          <text class="label-required">必填</text>
          <view class="label-spacer" />
          <text class="label-tip">共 {{ books.length }} 个旅行册</text>
        </view>

        <view class="select-card" @click="toggleBookPicker">
          <view class="sc-thumb">
            <image
              v-if="selectedBook"
              class="sc-img"
              :src="bookCover(selectedBook.id)"
              mode="aspectFill"
            />
          </view>
          <view class="sc-info">
            <text class="sc-name">{{ selectedBook?.name || '请选择旅行册' }}</text>
            <text class="sc-meta">{{ bookMeta(selectedBook) || '账本会挂在所选旅行册下' }}</text>
          </view>
          <Icon
            class="sc-arrow"
            :class="{ open: showBookPicker }"
            name="chevron-down"
            color="#9AA39D"
            :weight="1.8"
            size="32rpx"
          />
        </view>

        <!-- 旅行册下拉 -->
        <view v-if="showBookPicker" class="picker-panel">
          <view
            v-for="b in books"
            :key="b.id"
            class="pk-item"
            :class="{ active: b.id === bookId }"
            @click="pickBook(b.id)"
          >
            <view class="pk-thumb">
              <image class="sc-img" :src="bookCover(b.id)" mode="aspectFill" />
            </view>
            <view class="pk-info">
              <text class="pk-name">{{ b.name }}</text>
              <text class="pk-meta">{{ bookMeta(b) }}</text>
            </view>
            <view class="pk-check" :class="{ on: b.id === bookId }">
              <Icon
                v-if="b.id === bookId"
                name="check"
                color="#FFFFFF"
                :weight="2.4"
                size="20rpx"
              />
            </view>
          </view>
        </view>
      </view>

      <!-- 账本名称 -->
      <view class="field">
        <view class="field-label">
          <text class="label-name">账本名称</text>
          <text class="label-required">必填</text>
          <view class="label-spacer" />
          <text class="label-tip">最多 {{ MAX_NAME }} 字</text>
        </view>
        <view class="input-card">
          <input
            class="ic-input"
            :value="name"
            :maxlength="MAX_NAME"
            placeholder="给这个账本取个名字"
            placeholder-style="color:#B0B8B2"
            confirm-type="done"
            @input="onNameInput"
          />
          <text class="ic-counter">{{ nameLen }}/{{ MAX_NAME }}</text>
        </view>
      </view>

      <!-- 邀请成员 -->
      <view class="field">
        <view class="row-card" @click="toggleMemberPicker">
          <view class="rc-info">
            <text class="rc-title">邀请成员</text>
            <text class="rc-desc">一起记账、共同分摊费用</text>
          </view>
          <view class="rc-right">
            <view v-if="selectedMembers.length" class="avatar-stack">
              <view
                v-for="(m, i) in selectedMembers.slice(0, 3)"
                :key="m.id"
                class="avatar"
                :style="avatarStyle(i)"
              >
                <text>{{ initial(m.nickname) }}</text>
              </view>
              <text v-if="selectedMembers.length > 3" class="avatar-more">
                +{{ selectedMembers.length - 3 }}
              </text>
            </view>
            <text v-else class="rc-hint">暂未邀请</text>
            <Icon name="chevron-right" color="#B0B8B2" :weight="1.8" size="28rpx" />
          </view>
        </view>
      </view>

      <!-- 是否公开 -->
      <view class="field">
        <view class="row-card">
          <view class="rc-info">
            <text class="rc-title">对所有人公开</text>
            <text class="rc-desc">关闭后仅账本成员可见</text>
          </view>
          <switch
            class="rc-switch"
            :checked="isPublic"
            color="#2E9E6B"
            @change="onPublicChange"
          />
        </view>
      </view>

      <!-- 说明 -->
      <view class="notice">
        <Icon class="nt-icon" name="info" color="#2E9E6B" :weight="1.8" size="28rpx" />
        <view class="nt-text">
          <text class="nt-line">账本会挂在所选旅行册下，成员与游记共享</text>
          <text class="nt-line sub">创建后可在账本设置中修改成员与公开范围</text>
        </view>
      </view>

      <view class="scroll-space" />
    </scroll-view>

    <!-- 底部操作 -->
    <view class="bottom-bar">
      <button class="tj-btn-primary submit-btn" @click="create">创建账本</button>
    </view>

    <!-- 成员选择弹层（mp-weixin 不支持 @click.self，用 sheet 的 @click.stop 阻断冒泡） -->
    <view v-if="showMemberPicker" class="sheet-mask" @click="confirmMembers">
      <view class="sheet" @click.stop>
        <view class="sheet-head">
          <text class="sh-title">邀请成员</text>
          <text class="sh-sub">选择一起记账的好友，创建后会发送邀请</text>
        </view>
        <scroll-view scroll-y class="sheet-list">
          <view
            v-for="(f, i) in friends"
            :key="f.id"
            class="fr-item"
            @click="toggleMember(f.id)"
          >
            <view class="avatar fr-avatar" :style="avatarStyle(i)">
              <text>{{ initial(f.nickname) }}</text>
            </view>
            <text class="fr-name">{{ f.nickname }}</text>
            <view class="fr-check" :class="{ on: memberIds.includes(f.id) }">
              <Icon
                v-if="memberIds.includes(f.id)"
                name="check"
                color="#FFFFFF"
                :weight="2.4"
                size="22rpx"
              />
            </view>
          </view>
        </scroll-view>
        <button class="tj-btn-primary sheet-confirm" @click="confirmMembers">
          {{ memberIds.length ? `已选 ${memberIds.length} 位，确定` : '暂不邀请' }}
        </button>
      </view>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.create-page {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #f5f7f5;
}
/* 高度由 utils/safe-area.ts 按机型注入 */
.status-bar {
  width: 100%;
  flex-shrink: 0;
}

.form-scroll {
  flex: 1;
  min-height: 0;
  padding: 0 32rpx;
}

/* ---------- 字段通用 ---------- */
.field {
  margin-top: 36rpx;
}
.field-label {
  display: flex;
  align-items: center;
  gap: 10rpx;
  margin-bottom: 16rpx;
  padding: 0 4rpx;
  .label-name {
    font-size: 26rpx;
    font-weight: 700;
    color: #1a2e2a;
  }
  .label-required {
    font-size: 18rpx;
    font-weight: 500;
    color: #f5761b;
    background: #fff1e5;
    border-radius: 6rpx;
    padding: 4rpx 10rpx;
    line-height: 1;
  }
  .label-spacer {
    flex: 1;
  }
  .label-tip {
    font-size: 21rpx;
    color: #9aa39d;
  }
}

/* ---------- 旅行册选择卡 ---------- */
.select-card {
  display: flex;
  align-items: center;
  gap: 20rpx;
  padding: 24rpx;
  border-radius: 24rpx;
  background: #ffffff;
  box-shadow: 0 2rpx 16rpx rgba(26, 46, 42, 0.05);
  .sc-thumb {
    width: 72rpx;
    height: 72rpx;
    border-radius: 18rpx;
    overflow: hidden;
    background: #dde8e0;
    flex-shrink: 0;
  }
  .sc-img {
    width: 100%;
    height: 100%;
    display: block;
  }
  .sc-info {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 6rpx;
    .sc-name {
      font-size: 28rpx;
      font-weight: 600;
      color: #1a2e2a;
      overflow: hidden;
      white-space: nowrap;
      text-overflow: ellipsis;
    }
    .sc-meta {
      font-size: 21rpx;
      color: #9aa39d;
      overflow: hidden;
      white-space: nowrap;
      text-overflow: ellipsis;
    }
  }
  .sc-arrow {
    flex-shrink: 0;
    transition: transform 0.2s;
    &.open {
      transform: rotate(180deg);
    }
  }
}

/* 旅行册下拉面板 */
.picker-panel {
  margin-top: 14rpx;
  background: #ffffff;
  border-radius: 24rpx;
  padding: 10rpx;
  box-shadow: 0 12rpx 36rpx rgba(26, 46, 42, 0.12);
  .pk-item {
    display: flex;
    align-items: center;
    gap: 16rpx;
    padding: 18rpx 16rpx;
    border-radius: 18rpx;
    &.active {
      background: #f2faf5;
    }
    .pk-thumb {
      width: 64rpx;
      height: 64rpx;
      border-radius: 16rpx;
      overflow: hidden;
      background: #dde8e0;
      flex-shrink: 0;
    }
    .pk-info {
      flex: 1;
      min-width: 0;
      display: flex;
      flex-direction: column;
      gap: 4rpx;
      .pk-name {
        font-size: 26rpx;
        font-weight: 600;
        color: #1a2e2a;
      }
      .pk-meta {
        font-size: 20rpx;
        color: #9aa39d;
        overflow: hidden;
        white-space: nowrap;
        text-overflow: ellipsis;
      }
    }
    .pk-check {
      width: 36rpx;
      height: 36rpx;
      border-radius: 50%;
      border: 2rpx solid #d8e2dc;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      &.on {
        background: #1e9e6a;
        border-color: #1e9e6a;
      }
    }
  }
}

/* ---------- 名称输入卡 ---------- */
.input-card {
  display: flex;
  align-items: center;
  gap: 16rpx;
  padding: 0 24rpx;
  height: 104rpx;
  border-radius: 24rpx;
  background: #ffffff;
  box-shadow: 0 2rpx 16rpx rgba(26, 46, 42, 0.05);
  .ic-input {
    flex: 1;
    min-width: 0;
    font-size: 28rpx;
    font-weight: 500;
    color: #1a2e2a;
  }
  .ic-counter {
    font-size: 20rpx;
    color: #b0b8b2;
    flex-shrink: 0;
  }
}

/* ---------- 设置行卡 ---------- */
.row-card {
  display: flex;
  align-items: center;
  gap: 20rpx;
  padding: 26rpx 24rpx;
  border-radius: 24rpx;
  background: #ffffff;
  box-shadow: 0 2rpx 16rpx rgba(26, 46, 42, 0.05);
  .rc-info {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 6rpx;
    .rc-title {
      font-size: 28rpx;
      font-weight: 600;
      color: #1a2e2a;
    }
    .rc-desc {
      font-size: 21rpx;
      color: #9aa39d;
    }
  }
  .rc-right {
    display: flex;
    align-items: center;
    gap: 10rpx;
    flex-shrink: 0;
  }
  .rc-hint {
    font-size: 21rpx;
    color: #b0b8b2;
  }
  .rc-switch {
    flex-shrink: 0;
    transform: scale(0.82);
    transform-origin: right center;
  }
}

/* 头像组 */
.avatar-stack {
  display: flex;
  align-items: center;
  .avatar {
    width: 52rpx;
    height: 52rpx;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 22rpx;
    font-weight: 600;
    border: 3rpx solid #ffffff;
    margin-left: -14rpx;
    &:first-child {
      margin-left: 0;
    }
  }
  .avatar-more {
    margin-left: 6rpx;
    font-size: 20rpx;
    color: #9aa39d;
  }
}

/* ---------- 说明卡 ---------- */
.notice {
  margin-top: 36rpx;
  display: flex;
  align-items: flex-start;
  gap: 14rpx;
  padding: 24rpx 22rpx;
  border-radius: 20rpx;
  background: #eaf3ec;
  .nt-icon {
    margin-top: 4rpx;
  }
  .nt-text {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 6rpx;
    .nt-line {
      font-size: 21rpx;
      line-height: 1.5;
      color: #1a2e2a;
      &.sub {
        color: #6b7a74;
      }
    }
  }
}

.scroll-space {
  height: 220rpx;
}

/* ---------- 底部按钮 ---------- */
.bottom-bar {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  padding: 20rpx 32rpx calc(24rpx + env(safe-area-inset-bottom));
  background: linear-gradient(transparent, #f5f7f5 24%);
  .submit-btn {
    width: 100%;
  }
}

/* ---------- 成员选择弹层 ---------- */
.sheet-mask {
  position: fixed;
  inset: 0;
  z-index: 999;
  background: rgba(0, 0, 0, 0.42);
  display: flex;
  align-items: flex-end;
}
.sheet {
  width: 100%;
  background: #ffffff;
  border-radius: 32rpx 32rpx 0 0;
  padding: 36rpx 32rpx calc(28rpx + env(safe-area-inset-bottom));
  display: flex;
  flex-direction: column;
  max-height: 76vh;
  .sheet-head {
    display: flex;
    flex-direction: column;
    gap: 8rpx;
    .sh-title {
      font-size: 32rpx;
      font-weight: 700;
      color: #1a2e2a;
    }
    .sh-sub {
      font-size: 22rpx;
      color: #9aa39d;
    }
  }
  .sheet-list {
    margin-top: 20rpx;
    max-height: 52vh;
    .fr-item {
      display: flex;
      align-items: center;
      gap: 20rpx;
      padding: 20rpx 8rpx;
      border-bottom: 1rpx solid #f2f5f3;
      .fr-avatar {
        width: 68rpx;
        height: 68rpx;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 26rpx;
        font-weight: 600;
        flex-shrink: 0;
        border: none;
        margin-left: 0;
      }
      .fr-name {
        flex: 1;
        font-size: 28rpx;
        font-weight: 500;
        color: #1a2e2a;
      }
      .fr-check {
        width: 40rpx;
        height: 40rpx;
        border-radius: 50%;
        border: 2rpx solid #d8e2dc;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
        &.on {
          background: #1e9e6a;
          border-color: #1e9e6a;
        }
      }
    }
  }
  .sheet-confirm {
    margin-top: 24rpx;
    width: 100%;
  }
}
</style>
