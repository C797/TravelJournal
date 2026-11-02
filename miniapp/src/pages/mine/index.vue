<script setup lang="ts">
import { computed, ref } from 'vue'
import { onLoad, onShow } from '@dcloudio/uni-app'
import TabBar from '@/components/TabBar.vue'
import Icon from '@/components/Icon.vue'
import { useAppStore } from '@/stores/app'
import { userApi } from '@/api/auth'
import { uploadImage } from '@/utils/request'
import { statusBarStyle } from '@/utils/safe-area'

const appStore = useAppStore()

const isLoggedIn = computed(() => appStore.isLogin)

// 资料编辑面板：头像 + 昵称
const showProfile = ref(false)
// 编辑中暂存的头像/昵称（保存前不写回 store）
const editAvatar = ref('')
const editNickname = ref('')
/** 头像上传中 */
const uploading = ref(false)
const saving = ref(false)

/** 我的内容统计（来自服务端） */
const myStats = ref({ travelBooks: 0, journals: 0, spots: 0, bills: 0 })

const stats = computed(() => [
  { num: pad(myStats.value.travelBooks), label: '旅行册' },
  { num: pad(myStats.value.journals), label: '篇游记' },
  { num: pad(myStats.value.spots), label: '个地点' },
  { num: pad(myStats.value.bills), label: '笔账单' }
])

const contentItems = computed(() => [
  {
    name: '我的旅行册',
    desc: `${myStats.value.travelBooks} 段旅程`,
    path: '/pages/travel-books/index',
    icon: 'album'
  },
  {
    name: '我的游记',
    desc: `${myStats.value.journals} 篇记录`,
    path: '/pages/journals/index',
    icon: 'doc'
  },
  {
    name: '我的足迹',
    desc: `${myStats.value.spots} 个地点`,
    path: '/pages/spots/index',
    icon: 'pin'
  },
  {
    name: '我的账单',
    desc: `${myStats.value.bills} 笔收支`,
    path: '/pages/ledger/index',
    icon: 'wallet'
  }
])

const serviceItems = [
  { name: '数据导出', action: 'export', icon: 'download' },
  { name: '设置', action: 'setting', icon: 'sun' },
  { name: '意见反馈', action: 'feedback', icon: 'help' },
  { name: '关于途记', action: 'about', icon: 'info' }
]

/** 两位数字展示：3 → 03 */
function pad(n: number) {
  return String(n).padStart(2, '0')
}

async function loadStats() {
  if (!appStore.isLogin) {
    myStats.value = { travelBooks: 0, journals: 0, spots: 0, bills: 0 }
    return
  }
  const s = await userApi.stats().catch(() => null)
  if (s) myStats.value = s
}

async function loadData() {
  await appStore.init()
  // 用户主动退出后不再自动登录，需点击「微信登录」重新登录
  await appStore.ensureLogin()
  await loadStats()
}

onLoad(() => {
  loadData()
})

onShow(() => {
  if (appStore.ready) loadStats()
})

/**
 * 点击「微信登录」：
 * 取 code（未配置 AppID 时用固定演示 code）→ POST /auth/wx-login 换 token。
 * 登录成功后：新用户引导授权昵称头像，老用户直接提示欢迎回来。
 */
async function onWxLogin() {
  if (appStore.logging) return

  uni.showLoading({ title: '微信登录中', mask: true })
  try {
    const res = await appStore.loginByWx()
    await loadStats()
    uni.hideLoading()

    if (appStore.needProfile) {
      openProfile()
    } else {
      uni.showToast({
        title: `欢迎回来，${res.userInfo?.nickname || '旅行者'}`,
        icon: 'none'
      })
    }
  } catch (e: any) {
    uni.hideLoading()
    uni.showToast({ title: e?.message || '登录失败，请重试', icon: 'none' })
  }
}

/** 打开资料编辑面板：带出当前头像与昵称 */
function openProfile() {
  if (!appStore.isLogin) return
  const name = appStore.user?.nickname || ''
  editNickname.value = name && name !== '旅行者' ? name : ''
  editAvatar.value = appStore.displayAvatar
  showProfile.value = true
}

/** 上传头像到服务端，返回永久 URL；失败保留本地临时路径 */
async function uploadAvatar(tempPath: string) {
  uploading.value = true
  uni.showLoading({ title: '上传头像', mask: true })
  try {
    const { url } = await uploadImage(tempPath)
    editAvatar.value = url
  } catch {
    // 上传失败时保留临时路径，至少本次可见
  } finally {
    uni.hideLoading()
    uploading.value = false
  }
}

/**
 * 微信头像：<button open-type="chooseAvatar"> 回调。
 * 微信返回的是临时路径，必须上传换永久 URL，否则换设备/清缓存后头像就丢了。
 */
async function onChooseAvatar(e: any) {
  const temp = e.detail.avatarUrl || ''
  if (!temp) return
  editAvatar.value = temp
  await uploadAvatar(temp)
}

/** 从相册/相机自行选择头像 */
function chooseFromAlbum() {
  uni.chooseImage({
    count: 1,
    sizeType: ['compressed'],
    sourceType: ['album', 'camera'],
    success: async (res) => {
      const path = (res.tempFilePaths || [])[0]
      if (!path) return
      editAvatar.value = path
      await uploadAvatar(path)
    }
  })
}

// 昵称输入框回调（type="nickname" 时可直接带出微信昵称）
function onNicknameInput(e: any) {
  editNickname.value = e.detail.value || ''
}

// 保存资料：本地缓存 + 同步服务端
async function saveProfile() {
  if (saving.value || uploading.value) return

  const nickname = editNickname.value.trim()
  if (!nickname && !editAvatar.value) {
    uni.showToast({ title: '请填写昵称或选择头像', icon: 'none' })
    return
  }

  saving.value = true
  try {
    await appStore.updateProfile(nickname, editAvatar.value)
    showProfile.value = false
    uni.showToast({ title: '已保存', icon: 'success' })
  } finally {
    saving.value = false
  }
}

// 退出登录：通知后端 → 清本地会话
function onLogout() {
  uni.showModal({
    title: '退出登录',
    content: '确定要退出当前微信账号吗？',
    confirmColor: '#2E9E6B',
    success: async (res) => {
      if (!res.confirm) return
      uni.showLoading({ title: '正在退出', mask: true })
      try {
        await appStore.logout()
      } finally {
        uni.hideLoading()
      }
      myStats.value = { travelBooks: 0, journals: 0, spots: 0, bills: 0 }
      uni.showToast({ title: '已退出', icon: 'none' })
    }
  })
}

function goContent(path: string) {
  if (path === '/pages/travel-books/index' || path === '/pages/ledger/index') {
    uni.reLaunch({ url: path })
  } else {
    uni.navigateTo({ url: path })
  }
}

function onService(action: string) {
  if (action === 'export') {
    uni.showToast({ title: '正在导出数据…', icon: 'none' })
  } else {
    uni.showToast({ title: '功能建设中', icon: 'none' })
  }
}

function onQuick() {
  uni.navigateTo({ url: '/pages/journals/edit' })
}
</script>

<template>
  <view class="mine-page">
    <view class="status-bar" :style="statusBarStyle" />

    <view class="page-head">
      <text class="page-title">我的</text>
    </view>

    <!-- 个人卡 -->
    <view class="profile">
      <view class="profile-top">
        <!-- 头像：已登录点头像进入资料编辑，未登录展示占位 -->
        <button v-if="isLoggedIn" class="avatar avatar-btn" @click="openProfile">
          <image
            v-if="appStore.displayAvatar"
            class="avatar-img"
            :src="appStore.displayAvatar"
            mode="aspectFill"
          />
          <text v-else class="avatar-txt">{{ (appStore.displayName || '旅')[0] }}</text>
          <view class="avatar-badge">
            <Icon name="camera" color="#ffffff" :weight="1.8" size="20rpx" />
          </view>
        </button>
        <view v-else class="avatar avatar-guest">
          <Icon name="user" color="#9db8a5" :weight="1.6" size="48rpx" />
        </view>

        <view class="profile-info">
          <text class="p-name" @click="openProfile">{{ appStore.displayName }}</text>
          <text class="p-sign">{{ appStore.user?.signature || '把世界装进记忆里' }}</text>
          <view v-if="!isLoggedIn" class="login-row">
            <text class="login-tip">登录后同步你的旅行记忆</text>
            <view class="login-btn" :class="{ loading: appStore.logging }" @click="onWxLogin">
              <Icon name="user" color="#fff" :weight="1.8" size="26rpx" />
              <text>{{ appStore.logging ? '登录中…' : '微信登录' }}</text>
            </view>
          </view>
          <text v-else-if="appStore.needProfile" class="p-id profile-hint" @click="openProfile">
            完善头像和昵称 ›
          </text>
          <text v-else class="p-id">ID {{ appStore.user?.userIdCode || '' }}</text>
        </view>

        <!-- 已登录：退出登录 -->
        <view v-if="isLoggedIn" class="logout-btn" @click="onLogout">
          <text>退出</text>
        </view>
      </view>

      <view class="p-divider" />

      <view class="p-stats">
        <view v-for="s in stats" :key="s.label" class="p-stat">
          <text class="ps-num">{{ s.num }}</text>
          <text class="ps-label">{{ s.label }}</text>
        </view>
      </view>
    </view>

    <!-- 我的内容 -->
    <view class="section">
      <text class="section-title">我的内容</text>
      <view class="menu-card">
        <view v-for="(item, i) in contentItems" :key="item.name" class="menu-row" @click="goContent(item.path)">
          <view class="row-icon">
            <Icon :name="item.icon" color="#2E9E6B" :weight="1.55" size="40rpx" />
          </view>
          <view class="row-text">
            <text class="row-name">{{ item.name }}</text>
            <text class="row-desc">{{ item.desc }}</text>
          </view>
          <Icon class="row-chev" name="chevron-right" color="#C4CCC6" size="32rpx" />
          <view v-if="i < contentItems.length - 1" class="row-line" />
        </view>
      </view>
    </view>

    <!-- 更多服务 -->
    <view class="section">
      <text class="section-title">更多服务</text>
      <view class="menu-card">
        <view v-for="(item, i) in serviceItems" :key="item.name" class="menu-row service-row" @click="onService(item.action)">
          <view class="row-icon plain">
            <Icon :name="item.icon" color="#4A5752" :weight="1.55" size="40rpx" />
          </view>
          <text class="row-name">{{ item.name }}</text>
          <Icon class="row-chev" name="chevron-right" color="#C4CCC6" size="32rpx" />
          <view v-if="i < serviceItems.length - 1" class="row-line" />
        </view>
      </view>
    </view>

    <TabBar active="mine" @quick="onQuick" />

    <!-- 资料编辑面板：头像（微信头像 / 相册）+ 昵称（微信昵称 / 手动输入） -->
    <!-- 注意：mp-weixin 不支持 @click.self，靠 sheet 上的 @click.stop 阻断冒泡 -->
    <view v-if="showProfile" class="auth-mask" @click="showProfile = false">
      <view class="auth-sheet" @click.stop>
        <text class="auth-title">编辑个人资料</text>
        <text class="auth-sub">头像和昵称会同步到你的所有旅行记录</text>

        <!-- 头像：官方 chooseAvatar 可取微信头像，也可从相册自选 -->
        <view class="avatar-edit">
          <button class="auth-avatar-btn" open-type="chooseAvatar" @chooseavatar="onChooseAvatar">
            <image v-if="editAvatar" class="auth-avatar-img" :src="editAvatar" mode="aspectFill" />
            <view v-else class="auth-avatar-placeholder">
              <Icon name="camera" color="#2E9E6B" :weight="1.6" size="44rpx" />
            </view>
            <view class="auth-avatar-badge">
              <Icon name="camera" color="#fff" :weight="1.8" size="20rpx" />
            </view>
          </button>
          <view class="avatar-actions">
            <text class="avatar-action-main">{{ uploading ? '头像上传中…' : '点击头像使用微信头像' }}</text>
            <text class="avatar-action-sub" @click="chooseFromAlbum">从相册选择</text>
          </view>
        </view>

        <view class="auth-nick-row">
          <text class="auth-label">昵称</text>
          <input
            class="auth-nick-input"
            type="nickname"
            confirm-type="done"
            placeholder="点击可选用微信昵称"
            placeholder-class="auth-nick-ph"
            :value="editNickname"
            @input="onNicknameInput"
            @blur="onNicknameInput"
          />
        </view>
        <text class="auth-tip">点击昵称输入框，可在键盘上方一键选用微信昵称</text>

        <view class="auth-actions">
          <view class="auth-cancel" @click="showProfile = false">取消</view>
          <view class="auth-confirm" :class="{ disabled: saving || uploading }" @click="saveProfile">
            {{ saving ? '保存中…' : '保存' }}
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.mine-page {
  min-height: 100vh;
  background: #f5f7f5;
  padding: 0 32rpx calc(240rpx + env(safe-area-inset-bottom));
}

/* 高度由 utils/safe-area.ts 按机型注入 */
.status-bar {
  width: 100%;
}

.page-head {
  padding: 4rpx 0 0 4rpx;
  .page-title {
    font-size: 44rpx;
    font-weight: 700;
    color: #1a2e2a;
    letter-spacing: 0.4rpx;
  }
}

/* 个人卡 */
.profile {
  margin-top: 28rpx;
  background: #234b3a;
  border-radius: 32rpx;
  padding: 40rpx 40rpx 32rpx;
}
.profile-top {
  display: flex;
  align-items: center;
}
.avatar {
  width: 104rpx;
  height: 104rpx;
  border-radius: 52rpx;
  background: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  overflow: hidden;
  .avatar-txt {
    font-family: 'Songti SC', 'Noto Serif SC', serif;
    font-size: 44rpx;
    font-weight: 600;
    color: #234b3a;
  }
}
/* 已登录头像：button 重置默认样式，并让相机角标溢出显示 */
.avatar-btn {
  position: relative;
  overflow: visible;
  margin: 0;
  padding: 0;
  line-height: 1;
  border: none;
  border-radius: 52rpx;
  &::after {
    border: none;
  }
}
/* 头像右下角相机角标，提示「可点击编辑」 */
.avatar-badge {
  position: absolute;
  right: -2rpx;
  bottom: -2rpx;
  width: 34rpx;
  height: 34rpx;
  border-radius: 50%;
  background: #2e9e6b;
  border: 3rpx solid #234b3a;
  display: flex;
  align-items: center;
  justify-content: center;
}
.avatar-img {
  width: 104rpx;
  height: 104rpx;
  border-radius: 52rpx;
}
/* 未登录头像：半透明占位 */
.avatar-guest {
  background: rgba(255, 255, 255, 0.18);
}
.profile-info {
  margin-left: 24rpx;
  display: flex;
  flex-direction: column;
  gap: 6rpx;
  flex: 1;
  min-width: 0;
}
.p-name {
  font-size: 32rpx;
  font-weight: 600;
  color: #ffffff;
}
.p-sign {
  font-size: 22rpx;
  color: #9db8a5;
}
.p-id {
  font-size: 20rpx;
  color: #7d9a89;
  letter-spacing: 0.6rpx;
}
/* 已登录但未授权昵称头像时的引导 */
.profile-hint {
  font-size: 22rpx;
  color: #9fd6b6;
  letter-spacing: 0;
}
/* 未登录：登录提示 + 微信登录按钮 */
.login-row {
  margin-top: 10rpx;
  display: flex;
  align-items: center;
  gap: 16rpx;
  .login-tip {
    font-size: 22rpx;
    color: #9db8a5;
  }
  .login-btn {
    display: flex;
    align-items: center;
    gap: 8rpx;
    padding: 10rpx 22rpx;
    border-radius: 30rpx;
    background: #2e9e6b;
    &.loading {
      opacity: 0.65;
    }
    text {
      font-size: 24rpx;
      font-weight: 600;
      color: #ffffff;
      line-height: 1;
    }
  }
}
/* 已登录：退出按钮 */
.logout-btn {
  flex-shrink: 0;
  align-self: flex-start;
  padding: 8rpx 18rpx;
  border-radius: 24rpx;
  border: 1rpx solid rgba(255, 255, 255, 0.3);
  text {
    font-size: 22rpx;
    color: rgba(255, 255, 255, 0.7);
  }
}
.p-divider {
  height: 1rpx;
  background: rgba(255, 255, 255, 0.14);
  margin: 30rpx 0 24rpx;
}
.p-stats {
  display: flex;
}
.p-stat {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6rpx;
  .ps-num {
    font-size: 36rpx;
    font-weight: 700;
    color: #ffffff;
    letter-spacing: -0.4rpx;
  }
  .ps-label {
    font-size: 20rpx;
    color: rgba(255, 255, 255, 0.6);
  }
}

/* 分组 */
.section {
  margin-top: 36rpx;
  .section-title {
    display: block;
    font-size: 26rpx;
    font-weight: 600;
    color: #1a2e2a;
    margin-bottom: 14rpx;
    padding-left: 4rpx;
  }
}
.menu-card {
  background: #ffffff;
  border-radius: 32rpx;
  padding: 0 32rpx;
}
.menu-row {
  position: relative;
  display: flex;
  align-items: center;
  min-height: 116rpx;
}
.service-row {
  height: 96rpx;
}
.row-icon {
  width: 64rpx;
  height: 64rpx;
  border-radius: 32rpx;
  background: #eaf3ec;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  &.plain {
    background: transparent;
    width: 64rpx;
    height: 64rpx;
  }
}
.row-svg {
  width: 36rpx;
  height: 36rpx;
}
.row-text {
  display: flex;
  flex-direction: column;
  margin-left: 24rpx;
  flex: 1;
  min-width: 0;
}
.row-name {
  font-size: 30rpx;
  font-weight: 600;
  color: #1a2e2a;
  line-height: 1.2;
}
.row-desc {
  margin-top: 6rpx;
  font-size: 24rpx;
  color: #9aa39d;
  line-height: 1.2;
}
.row-chev {
  margin-left: auto;
  width: 32rpx;
  height: 32rpx;
  flex-shrink: 0;
}

.row-line {
  position: absolute;
  left: 86rpx;
  right: 0;
  bottom: 0;
  height: 1rpx;
  background: #f0f3f1;
}

/* 微信昵称头像授权弹层 */
.auth-mask {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: flex-end;
  z-index: 999;
}
.auth-sheet {
  width: 100%;
  background: #ffffff;
  border-radius: 32rpx 32rpx 0 0;
  padding: 40rpx 40rpx calc(40rpx + env(safe-area-inset-bottom));
  display: flex;
  flex-direction: column;
  align-items: center;
}
.auth-title {
  font-size: 34rpx;
  font-weight: 700;
  color: #1a2e2a;
}
.auth-sub {
  margin-top: 10rpx;
  font-size: 24rpx;
  color: #9aa39d;
}
/* 头像编辑区 */
.avatar-edit {
  margin-top: 34rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16rpx;
}
.avatar-actions {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8rpx;
  .avatar-action-main {
    font-size: 24rpx;
    color: #6b7570;
  }
  .avatar-action-sub {
    font-size: 24rpx;
    font-weight: 600;
    color: #2e9e6b;
    padding: 4rpx 8rpx;
  }
}
.auth-avatar-btn {
  position: relative;
  overflow: visible;
  margin: 0;
  padding: 0;
  width: 160rpx;
  height: 160rpx;
  border-radius: 80rpx;
  background: transparent;
  border: none;
  &::after {
    border: none;
  }
}
.auth-avatar-badge {
  position: absolute;
  right: 0;
  bottom: 0;
  width: 44rpx;
  height: 44rpx;
  border-radius: 50%;
  background: #2e9e6b;
  border: 4rpx solid #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
}
.auth-tip {
  margin-top: 14rpx;
  font-size: 22rpx;
  color: #9aa39d;
}
.auth-avatar-img {
  width: 160rpx;
  height: 160rpx;
  border-radius: 80rpx;
}
.auth-avatar-placeholder {
  width: 160rpx;
  height: 160rpx;
  border-radius: 80rpx;
  background: #eaf3ec;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10rpx;
  text {
    font-size: 22rpx;
    color: #2e9e6b;
  }
}
.auth-nick-row {
  margin-top: 32rpx;
  width: 100%;
  display: flex;
  align-items: center;
  height: 96rpx;
  border-radius: 24rpx;
  background: #f5f7f5;
  padding: 0 28rpx;
  .auth-label {
    font-size: 28rpx;
    font-weight: 600;
    color: #1a2e2a;
    margin-right: 24rpx;
    flex-shrink: 0;
  }
  .auth-nick-input {
    flex: 1;
    font-size: 28rpx;
    color: #1a2e2a;
  }
}
.auth-nick-ph {
  color: #b6bdb9;
}
.auth-actions {
  margin-top: 40rpx;
  width: 100%;
  display: flex;
  gap: 24rpx;
  .auth-cancel,
  .auth-confirm {
    flex: 1;
    height: 96rpx;
    border-radius: 28rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 30rpx;
    font-weight: 600;
  }
  .auth-cancel {
    color: #6b7570;
    background: #f0f3f1;
  }
  .auth-confirm {
    color: #ffffff;
    background: #2e9e6b;
    &.disabled {
      opacity: 0.6;
    }
  }
}
</style>
