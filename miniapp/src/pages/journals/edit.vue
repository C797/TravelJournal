<script setup lang="ts">
import { ref, computed } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import Icon from '@/components/Icon.vue'
import { statusBarStyle, menuRightStyle } from '@/utils/safe-area'
import { useAppStore } from '@/stores/app'
import { journalApi } from '@/api/book'
import { uploadImages } from '@/utils/request'
import type { TravelBook } from '@/types'

const appStore = useAppStore()

// 旅行册下拉：来自我的旅行册
const books = computed<TravelBook[]>(() => appStore.travelBooks)
const bookId = ref('')
const bookName = ref('')
const showBookPicker = ref(false)

// 天气下拉（带简洁线性图标；d 为纯 path 数据，由 Icon 组件包进 <path d="..."/>）
// 注：Icon 组件只接受单条 path 的 d，因此太阳等图形均用纯 path 表达（圆用两段弧描边，不用 <circle>）
const weather = ref('')
const weatherOptions = [
  { name: '晴朗', d: 'M12 7.6a4.4 4.4 0 1 0 0 8.8 4.4 4.4 0 0 0 0-8.8ZM12 3v2.2M12 18.8V21M3 12h2.2M18.8 12H21M5.6 5.6l1.6 1.6M16.8 16.8l1.6 1.6M5.6 18.4l1.6-1.6M16.8 7.2l1.6-1.6' },
  { name: '多云', d: 'M6.5 18.5h9a3.5 3.5 0 0 0 .3-7A4.5 4.5 0 0 0 7.4 13M9 10a3.6 3.6 0 1 0 0-7.2 3.6 3.6 0 0 0 0 7.2ZM5.6 11.6a2.8 2.8 0 0 1 .6-5.1' },
  { name: '阴天', d: 'M6.5 18.5h10a4 4 0 0 0 .4-8A5.2 5.2 0 0 0 6.8 13.2' },
  { name: '小雨', d: 'M6.5 18h9a3.6 3.6 0 0 0 .3-7.2A4.8 4.8 0 0 0 6.9 12.6M8.6 15.4l.6 1.8M12 15.4l.6 1.8M15.4 15.4l.6 1.8' },
  { name: '中雨', d: 'M6.5 17h9a3.6 3.6 0 0 0 .3-7.2A4.8 4.8 0 0 0 6.9 11.6M8 14.6l.6 1.8M11.2 14.6l.6 1.8M14.4 14.6l.6 1.8M9.6 18.2l.6 1.8M12.8 18.2l.6 1.8' },
  { name: '大雨', d: 'M6.5 16h9a3.6 3.6 0 0 0 .3-7.2A4.8 4.8 0 0 0 6.9 10.6M8 13.8l.6 1.8M11.2 13.8l.6 1.8M14.4 13.8l.6 1.8M9.6 17.4l.6 1.8M12.8 17.4l.6 1.8M8 20.6l.6 1.8M11.2 20.6l.6 1.8' },
  { name: '小雪', d: 'M6.5 18h9a3.6 3.6 0 0 0 .3-7.2A4.8 4.8 0 0 0 6.9 12.6M8.5 15.6l.1 1.8M10.4 14.8l.1 1.8M12.3 15.6l.1 1.8M14.2 14.8l.1 1.8M8.5 19l.1 1.8M12.3 19l.1 1.8' },
  { name: '中雪', d: 'M6.5 16.5h9a3.6 3.6 0 0 0 .3-7.2A4.8 4.8 0 0 0 6.9 11M8 14.2l.1 1.8M10 13.4l.1 1.8M12 14.2l.1 1.8M14 13.4l.1 1.8M8 17.6l.1 1.8M12 17.6l.1 1.8M10 20.6l.1 1.8M14 20.6l.1 1.8' },
  { name: '雾', d: 'M6.5 18h9a3.6 3.6 0 0 0 .3-7.2A4.8 4.8 0 0 0 6.9 12.6M4 16h6M12 16h6M5 20h9' },
  { name: '沙尘', d: 'M3.5 9h13M5 13.5h15M7 18h11M16 6.5h.01M18.5 4.5h.01M18.5 8h.01' },
  { name: '台风', d: 'M16.5 8.5a4.5 4.5 0 1 0-4.5 6.5M8 9.5a4 4 0 1 1 3.5 5.5M10 17a3 3 0 1 0 3.5-4' },
  { name: '冰雹', d: 'M6.5 16h9a3.6 3.6 0 0 0 .3-7.2A4.8 4.8 0 0 0 6.9 10.6M9 13.8h.01M12 13.8h.01M15 13.8h.01M10.5 16.8h.01M13.5 16.8h.01' }
]
const showWeatherPicker = ref(false)

// 当前选中天气的图标 path（未选中时为空）
const selectedWeatherIcon = computed(
  () => weatherOptions.find((w) => w.name === weather.value)?.d || ''
)

const title = ref('')
const content = ref('')

// 出行日期（默认今天）
const travelDate = ref('')
const dateText = computed(() => {
  if (!travelDate.value) return '选择日期'
  const d = new Date(travelDate.value.replace(/-/g, '/'))
  const week = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][d.getDay()]
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${mm}.${dd} ${week}`
})

// 地点：旅行地点（定位选点）+ 关联地点（所属市名，自动关联）
const location = ref('')
const locationCity = ref('')

const visibility = ref<'private' | 'public'>('private')
/**
 * 相册图片：存服务端返回的永久 URL。
 * 选择后立即上传，避免发布时批量上传超时；上传失败的项不进入列表。
 */
const photos = ref<string[]>([])
const uploading = ref(false)
/** 编辑模式下的游记 id（有值表示在编辑已有游记） */
const editingId = ref('')
const submitting = ref(false)

const titleLen = computed(() => title.value.length)
const contentLen = computed(() => content.value.length)

// 已选中的旅行册对象
const selectedBook = computed(() => books.value.find((b) => b.id === bookId.value))

onLoad(async (query: any) => {
  // 先拉旅行册，保证下拉有数据
  await appStore.init()
  await appStore.ensureLogin()
  await appStore.loadBooks()

  if (query?.bookId) {
    bookId.value = query.bookId
    bookName.value = books.value.find((b) => b.id === query.bookId)?.name || ''
  } else if (books.value.length) {
    // 默认选中第一本，省去用户一步
    bookId.value = books.value[0].id
    bookName.value = books.value[0].name
  }

  // 编辑模式：回填已有游记
  if (query?.id) {
    editingId.value = query.id
    try {
      const j = await journalApi.detail(query.id)
      title.value = j.title || ''
      content.value = j.content || ''
      travelDate.value = String(j.travelDate).slice(0, 10)
      weather.value = j.weather || ''
      location.value = j.locationName || ''
      visibility.value = j.isPublic ? 'public' : 'private'
      bookId.value = j.bookId
      bookName.value = books.value.find((b) => b.id === j.bookId)?.name || bookName.value
      photos.value = (j.images || []).map((img) => img.url)
    } catch {
      uni.showToast({ title: '游记加载失败', icon: 'none' })
    }
  }
})

function goBack() {
  uni.navigateBack()
}

/** 选图并立即上传，拿到永久 URL 后加入相册 */
async function addPhoto() {
  if (uploading.value) return
  uni.chooseImage({
    count: 9 - photos.value.length,
    success: async (res) => {
      const paths = Array.isArray(res.tempFilePaths) ? res.tempFilePaths : [res.tempFilePaths]
      if (!paths.length) return
      // 未登录（无 token）时无法上传，先确保登录
      await appStore.ensureLogin()
      uploading.value = true
      uni.showLoading({ title: '上传中', mask: true })
      try {
        const urls = await uploadImages(paths)
        photos.value = [...photos.value, ...urls]
      } finally {
        uni.hideLoading()
        uploading.value = false
      }
    }
  })
}

function removePhoto(i: number) {
  photos.value.splice(i, 1)
}

// ---------- 所属旅行册：下拉选择 ----------
function toggleBookPicker() {
  showBookPicker.value = !showBookPicker.value
}
function pickBook(b: TravelBook) {
  bookId.value = b.id
  bookName.value = b.name
  showBookPicker.value = false
}

// ---------- 出行日期：日期选择器 ----------
function onDateChange(e: any) {
  travelDate.value = e.detail.value
}

// ---------- 天气：下拉选择 ----------
function toggleWeatherPicker() {
  showWeatherPicker.value = !showWeatherPicker.value
}
function pickWeather(w: { name: string; d: string }) {
  weather.value = w.name
  showWeatherPicker.value = false
}

// ---------- 旅行地点：微信定位选点 ----------
function chooseLocation() {
  uni.chooseLocation({
    success: (res: any) => {
      // res.name 为地点名，res.address 为详细地址
      const name = res.name || res.address || ''
      if (name) {
        location.value = name
        // 从 address 中提取市名（取「省/市」层级），作为关联地点
        locationCity.value = extractCity(res.address)
      }
    },
    fail: (err: any) => {
      // 用户取消选择不算错误
      if (err?.errMsg?.includes('cancel')) return
      uni.showToast({ title: '定位失败，请检查定位权限', icon: 'none' })
    }
  })
}

// 从 address 提取市名：如「四川省甘孜藏族自治州稻城县…」→「甘孜」
function extractCity(address: string): string {
  if (!address) return ''
  const m = address.match(/(?:省|自治区|市)([^市州地区县]+(?:市|州|地区|盟))/)
  if (m) return m[1]
  return ''
}

async function publish() {
  if (submitting.value) return
  if (!bookId.value) {
    uni.showToast({ title: '请选择所属旅行册', icon: 'none' })
    return
  }
  if (!title.value.trim()) {
    uni.showToast({ title: '请填写游记名称', icon: 'none' })
    return
  }
  if (!content.value.trim()) {
    uni.showToast({ title: '请填写游记正文', icon: 'none' })
    return
  }
  if (!travelDate.value) {
    uni.showToast({ title: '请选择出行日期', icon: 'none' })
    return
  }

  await appStore.ensureLogin()
  submitting.value = true
  uni.showLoading({ title: editingId.value ? '保存中' : '发布中', mask: true })

  try {
    const payload = {
      bookId: bookId.value,
      title: title.value.trim(),
      travelDate: travelDate.value,
      weather: weather.value || undefined,
      locationName: location.value || undefined,
      content: content.value.trim(),
      isPublic: visibility.value === 'public'
    }

    if (editingId.value) {
      await journalApi.update(editingId.value, payload)
    } else {
      await journalApi.create({ ...payload, imageList: photos.value })
    }

    uni.hideLoading()
    uni.showToast({ title: editingId.value ? '已保存' : '发布成功', icon: 'success' })
    setTimeout(() => uni.navigateBack(), 700)
  } catch (e: any) {
    uni.hideLoading()
    // request 层已弹过 toast，这里只兜底
    if (!e?.message) {
      uni.showToast({ title: '发布失败，请重试', icon: 'none' })
    }
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <view class="edit-page">
    <!-- 状态栏占位（高度按机型自适应） -->
    <view class="status-bar" :style="statusBarStyle" />
    <view class="tj-nav">
      <text class="tj-nav-back" @click="goBack">取消</text>
      <text class="tj-nav-title">写游记</text>
      <view class="publish-btn" :style="menuRightStyle" @click="publish">发布</view>
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
            <image class="photo-img" :src="p" mode="aspectFill" />
          </view>
          <view class="photo-add" @click="addPhoto">
            <Icon name="plus" color="#2E9E6B" :weight="2" size="40rpx" />
            <text class="pa-label">添加</text>
          </view>
        </view>
      </view>

      <!-- 所属旅行册 -->
      <view class="field">
        <view class="field-label"><text class="label-name">所属旅行册</text></view>
        <view class="select-card" @click="toggleBookPicker">
          <view class="sc-thumb">
            <image class="sc-img" :src="selectedBook?.coverUrl || '/static/photos/book-chuanxi.jpg'" mode="aspectFill" />
          </view>
          <text class="sc-value" :class="{ placeholder: !bookName }">{{ bookName || '请选择所属旅行册' }}</text>
          <Icon class="sc-arrow" :class="{ up: showBookPicker }" name="chevron-down" color="#9AA39D" size="32rpx" />
        </view>
        <!-- 旅行册下拉列表 -->
        <view v-if="showBookPicker" class="picker-list">
          <view
            v-for="b in books"
            :key="b.id"
            class="picker-item"
            :class="{ active: b.id === bookId }"
            @click="pickBook(b)"
          >
            <image class="pi-thumb" :src="b.coverUrl || '/static/photos/book-chuanxi.jpg'" mode="aspectFill" />
            <view class="pi-text">
              <text class="pi-name">{{ b.name }}</text>
              <text class="pi-desc">{{ b.yearMonth }} · {{ b.journalCount || 0 }} 篇</text>
            </view>
            <text v-if="b.id === bookId" class="pi-check">✓</text>
          </view>
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
          <!-- 出行日期：picker 日期选择器 -->
          <picker class="col-card picker-wrap" mode="date" :value="travelDate" @change="onDateChange">
            <view class="col-card-inner">
              <text class="cc-label">出行日期</text>
              <text class="cc-value" :class="{ placeholder: !travelDate }">{{ dateText }}</text>
            </view>
          </picker>
          <!-- 天气：下拉选择（选中后展示对应图标） -->
          <view class="col-card weather-wrap" @click="toggleWeatherPicker">
            <text class="cc-label">天气</text>
            <view class="weather-value-row">
              <Icon
                v-if="selectedWeatherIcon"
                :d="selectedWeatherIcon"
                color="#21a05b"
                :weight="1.7"
                size="32rpx"
              />
              <text class="cc-value" :class="{ placeholder: !weather }">{{ weather || '选择天气' }}</text>
            </view>
          </view>
        </view>
        <!-- 天气下拉列表 -->
        <view v-if="showWeatherPicker" class="weather-grid">
          <view
            v-for="w in weatherOptions"
            :key="w.name"
            class="weather-item"
            :class="{ active: w.name === weather }"
            @click="pickWeather(w)"
          >
            <Icon :d="w.d" :color="w.name === weather ? '#fff' : '#4a5752'" :weight="1.7" size="36rpx" />
            <text class="wi-name">{{ w.name }}</text>
          </view>
        </view>
      </view>

      <!-- 地点 -->
      <view class="field">
        <view class="field-label">
          <text class="label-name">地点</text>
          <text class="label-tip">{{ location ? '已定位' : '未选择' }}</text>
        </view>
        <view class="two-col">
          <view class="col-card loc-card" @click="chooseLocation">
            <text class="cc-label">旅行地点</text>
            <view class="loc-value-row">
              <text class="cc-value" :class="{ placeholder: !location }">{{ location || '点击定位选择' }}</text>
              <Icon name="locate" color="#21a05b" :weight="1.8" size="30rpx" />
            </view>
          </view>
          <view class="col-card">
            <text class="cc-label">关联地点</text>
            <text class="cc-value" :class="{ placeholder: !locationCity }">{{ locationCity || '自动关联市名' }}</text>
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
/* 文字型返回键：覆盖全局 44rpx 的大字号，避免“取消”两字换行 */
.tj-nav-back {
  font-size: 30rpx;
  font-weight: 500;
  color: #6b756f;
  justify-content: flex-start;
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
    overflow: hidden;
    .photo-img { width: 100%; height: 100%; display: block; }
  }
  .photo-add {
    background: #eaf3ec;
    border: 2rpx dashed #b8d8c4;
    flex-direction: column;
    gap: 6rpx;
    box-sizing: border-box;
    .pa-label { font-size: 20rpx; color: #2e9e6b; }
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
    overflow: hidden;
    background: #dde8e0;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .sc-value { flex: 1; margin-left: 16rpx; font-size: 28rpx; &.placeholder { color: #b6bdb9; } }
  .sc-img { width: 100%; height: 100%; display: block; border-radius: 12rpx; }
  .sc-arrow { flex-shrink: 0; transition: transform 0.2s; &.up { transform: rotate(180deg); } }
  .input { flex: 1; font-size: 28rpx; }
  .counter { font-size: 22rpx; color: #999; }
}

/* 旅行册下拉列表 */
.picker-list {
  margin-top: 12rpx;
  background: #fff;
  border-radius: 16rpx;
  padding: 8rpx;
  box-shadow: 0 8rpx 24rpx rgba(26, 46, 42, 0.08);
  .picker-item {
    display: flex;
    align-items: center;
    padding: 20rpx 16rpx;
    border-radius: 12rpx;
    &.active { background: #f2faf5; }
    .pi-thumb {
      width: 64rpx;
      height: 64rpx;
      border-radius: 12rpx;
      background: #dde8e0;
      flex-shrink: 0;
    }
    .pi-text {
      flex: 1;
      margin-left: 20rpx;
      display: flex;
      flex-direction: column;
      gap: 4rpx;
      .pi-name { font-size: 28rpx; font-weight: 600; color: #1a2e2a; }
      .pi-desc { font-size: 22rpx; color: #999; }
    }
    .pi-check { font-size: 32rpx; color: #21a05b; font-weight: 700; }
  }
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
    .cc-value {
      font-size: 28rpx;
      font-weight: 600;
      &.green { color: #21a05b; }
      &.placeholder { color: #b6bdb9; font-weight: 400; }
    }
  }
  .picker-wrap {
    padding: 0;
    .col-card-inner {
      padding: 24rpx;
      display: flex;
      flex-direction: column;
      gap: 8rpx;
    }
  }
  .weather-wrap {
    position: relative;
    // 下拉三角与「天气」标签同行右侧，避免压住下方的图标+文字
    &::after {
      content: '';
      position: absolute;
      right: 24rpx;
      top: 36rpx;
      width: 0;
      height: 0;
      border-left: 8rpx solid transparent;
      border-right: 8rpx solid transparent;
      border-top: 10rpx solid #9aa39d;
    }
    .weather-value-row {
      display: flex;
      align-items: center;
      gap: 10rpx;
    }
  }
  .loc-card {
    .loc-value-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
  }
}

/* 天气下拉网格 */
.weather-grid {
  margin-top: 12rpx;
  background: #fff;
  border-radius: 16rpx;
  padding: 20rpx;
  display: flex;
  flex-wrap: wrap;
  gap: 16rpx;
  box-shadow: 0 8rpx 24rpx rgba(26, 46, 42, 0.08);
  .weather-item {
    width: calc(25% - 12rpx);
    height: 128rpx;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 10rpx;
    background: #f2f5f3;
    border-radius: 12rpx;
    .wi-name {
      font-size: 24rpx;
      color: #4a5752;
      line-height: 1;
    }
    &.active {
      background: #21a05b;
      .wi-name { color: #fff; font-weight: 600; }
    }
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
