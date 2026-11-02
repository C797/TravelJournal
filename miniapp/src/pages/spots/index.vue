<script setup lang="ts">
import { computed, ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import ChinaMap from '@/components/ChinaMap.vue'
import Icon from '@/components/Icon.vue'
import { projectProvince } from '@/utils/map-projection'
import { provinces, provinceBounds } from '@/components/china-map-data'
import { useAppStore } from '@/stores/app'
import { spotApi } from '@/api/book'
import { userApi } from '@/api/auth'
import type { MapSpot } from '@/types'
import { statusBarStyle, navRightStyle } from '@/utils/safe-area'
import { chooseLocation, getCurrentLocation } from '@/utils/geo'
import type { PickedLocation } from '@/utils/geo'

const appStore = useAppStore()

const spots = ref<MapSpot[]>([])
const loading = ref(true)

// 页面锁定在某一本旅行册时（带 bookId 进入），新增点固定写进这本
const lockedBookId = ref('')

// ---------- 新增标注点：选地址（默认当前定位）→ 确认面板 → 落库 ----------
const showAdd = ref(false)
// 正在打开微信选点地图 / 取定位
const picking = ref(false)
const saving = ref(false)
// 已选中的地址
const picked = ref<PickedLocation | null>(null)
const addStatus = ref<'visited' | 'planned'>('visited')
const addDate = ref(todayStr())
const addBookId = ref('')

const books = computed(() => appStore.travelBooks)
const addBookName = computed(() => books.value.find((b) => b.id === addBookId.value)?.name || '')
const bookIndex = computed(() => {
  const i = books.value.findIndex((b) => b.id === addBookId.value)
  return i < 0 ? 0 : i
})

function todayStr() {
  const d = new Date()
  const m = `${d.getMonth() + 1}`.padStart(2, '0')
  const day = `${d.getDate()}`.padStart(2, '0')
  return `${d.getFullYear()}-${m}-${day}`
}

function onDateChange(e: any) {
  addDate.value = e.detail.value
}

function onBookChange(e: any) {
  const b = books.value[Number(e.detail.value)]
  if (b) addBookId.value = b.id
}

/** 点击「添加标注点」：先取当前定位，再打开微信地图（默认居中到当前地址）让用户自己选 */
async function openAdd() {
  if (picking.value || saving.value) return
  // 锁定旅行册（带 bookId 进入）时不依赖列表是否已加载
  if (!addBookId.value && !books.value.length) {
    uni.showToast({ title: '请先创建旅行册', icon: 'none' })
    return
  }

  picking.value = true
  uni.showLoading({ title: '获取当前位置', mask: true })
  let center: { latitude: number; longitude: number } | null = null
  try {
    center = await getCurrentLocation()
  } finally {
    uni.hideLoading()
  }

  try {
    const loc = await chooseLocation(center)
    if (!loc) return
    picked.value = loc
    addStatus.value = 'visited'
    addDate.value = todayStr()
    if (!addBookId.value && books.value[0]) addBookId.value = books.value[0].id
    showAdd.value = true
  } finally {
    picking.value = false
  }
}

/** 面板里「重选」：以当前选中点为中心再开一次地图 */
async function rechoose() {
  if (!picked.value) return openAdd()
  const loc = await chooseLocation({
    latitude: picked.value.latitude,
    longitude: picked.value.longitude
  })
  if (loc) picked.value = loc
}

/** 保存标注点 */
async function confirmAdd() {
  if (!picked.value || saving.value) return
  if (!addBookId.value) {
    uni.showToast({ title: '请选择所属旅行册', icon: 'none' })
    return
  }
  saving.value = true
  uni.showLoading({ title: '保存中', mask: true })
  try {
    const created = await spotApi.create({
      bookId: addBookId.value,
      locationName: picked.value.name,
      province: picked.value.province || undefined,
      city: picked.value.city || undefined,
      longitude: picked.value.longitude,
      latitude: picked.value.latitude,
      markStatus: addStatus.value,
      visitDate: addStatus.value === 'visited' ? addDate.value : undefined
    })

    const row: MapSpot = { ...created, journalCount: 0 }
    spots.value = [...spots.value, row]
    showAdd.value = false
    // 直接跳到该省地图并展开气泡，让用户立刻看到新加的点
    focusSpot(row)
    uni.hideLoading()
    uni.showToast({ title: '标注点已添加', icon: 'success' })
  } catch (e: any) {
    uni.hideLoading()
    uni.showToast({ title: e?.message || '添加失败，请重试', icon: 'none' })
  } finally {
    saving.value = false
  }
}

/** 定位到某个标注点所在的省份地图 */
function focusSpot(s: MapSpot) {
  const p = provinces.find((x) => x.name === s.province)
  if (p && provinceBounds[p.id]) {
    currentProvinceId.value = p.id
    view.value = 'province'
    activeId.value = s.id
  } else {
    backToNation()
  }
}

// 两级地图状态：view = 'nation' | 'province'
const view = ref<'nation' | 'province'>('nation')
// 当前进入的省份 id（如 CNSC / CNYN）
const currentProvinceId = ref<string | null>(null)
// 初始不选中任何点：气泡不显示，点击标点后才弹出
const activeId = ref<string | null>(null)

// 取某标注点的经纬度（优先用 mock 数据里的 longitude/latitude）
function spotCoord(s: MapSpot) {
  return {
    lng: s.longitude ?? 104,
    lat: s.latitude ?? 30
  }
}

// 当前省份对象（含 path 与 bounds）
const currentProvince = computed(() => {
  if (!currentProvinceId.value) return null
  const p = provinces.find((x) => x.id === currentProvinceId.value)
  const b = provinceBounds[currentProvinceId.value]
  if (!p || !b) return null
  return { ...p, bounds: b }
})

// 汇总「有标注点」的省份：按 province 字段分组
const provinceGroups = computed(() => {
  const map = new Map<string, MapSpot[]>()
  for (const s of spots.value) {
    const key = s.province || '其他'
    if (!map.has(key)) map.set(key, [])
    map.get(key)!.push(s)
  }
  // 关联到 provinces 数据（拿省份 id + bounds 中心），未知省份跳过
  const result: { id: string; name: string; count: number; pos: { left: string; top: string } }[] = []
  for (const [name, list] of map) {
    const p = provinces.find((x) => x.name === name)
    if (!p) continue
    const b = provinceBounds[p.id]
    if (!b) continue
    // 用包围盒几何中心作为省份标记位置（全国 viewBox 坐标）
    const cx = (b.x0 + b.x1) / 2
    const cy = (b.y0 + b.y1) / 2
    result.push({
      id: p.id,
      name,
      count: list.length,
      pos: {
        left: `${((cx / 1000) * 100).toFixed(3)}%`,
        top: `${((cy / 738) * 100).toFixed(3)}%`
      }
    })
  }
  return result
})

// 当前省份内的标注点（省级地图）
const mapCities = computed(() => {
  if (!currentProvinceId.value) return []
  const p = currentProvince.value
  if (!p) return []
  return spots.value
    .filter((s) => s.province === p.name)
    .map((s) => {
      const c = spotCoord(s)
      return {
        name: s.locationName,
        status: (s.markStatus === 'visited' ? 'visited' : 'planned') as 'visited' | 'planned',
        lng: c.lng,
        lat: c.lat,
        id: s.id
      }
    })
})

const visitedCount = computed(() => spots.value.filter((s) => s.markStatus === 'visited').length)
const activeSpot = computed(() => spots.value.find((s) => s.id === activeId.value))

// 气泡位置：跟随当前选中点位（未选中时为 null，气泡不渲染）
const activePos = computed(() => {
  if (!activeSpot.value || !currentProvince.value) return null
  const c = spotCoord(activeSpot.value)
  return projectProvince(c.lng, c.lat, currentProvince.value.bounds)
})

function dateText(s: MapSpot) {
  if (!s.visitDate) return '计划前往'
  return String(s.visitDate).slice(0, 10).replace(/-/g, '.')
}

onLoad(async (query: any) => {
  loading.value = true
  try {
    await appStore.init()
    await appStore.ensureLogin()
    // 指定 bookId 时只看该旅行册，否则汇总全部
    if (query?.bookId) {
      lockedBookId.value = query.bookId
      addBookId.value = query.bookId
      spots.value = await spotApi.listByBook(query.bookId).catch(() => [] as MapSpot[])
    } else {
      spots.value = await userApi.mySpots().catch(() => [] as MapSpot[])
      addBookId.value = appStore.travelBooks[0]?.id || ''
    }
  } finally {
    loading.value = false
  }
})

// 点击地图标点：选中并显示气泡
function onPinTap(key: string) {
  activeId.value = key
}

// 点击全国地图上的某省标记：进入该省省级地图
function onEnterProvince(id: string) {
  currentProvinceId.value = id
  view.value = 'province'
  activeId.value = null
}

// 返回全国地图
function backToNation() {
  view.value = 'nation'
  activeId.value = null
  currentProvinceId.value = null
}

function goBack() {
  uni.navigateBack()
}

function pick(s: MapSpot) {
  // 列表点击：切到该点所在省份地图并展开气泡
  if (s.province && provinces.find((x) => x.name === s.province)) {
    focusSpot(s)
  } else {
    activeId.value = s.id
  }
}

function toDetail() {
  uni.navigateTo({ url: '/pages/journals/index' })
}
</script>

<template>
  <view class="spots-page">
    <view class="status-bar" :style="statusBarStyle" />

    <!-- 导航 -->
    <view class="nav" :style="navRightStyle">
      <view class="nav-back" @click="goBack">
        <Icon name="chevron-left" color="#1A2E2A" size="40rpx" />
      </view>
      <text class="nav-title">标注点管理</text>
      <view class="nav-locate">
        <Icon name="locate" color="#4A5752" :weight="1.6" size="40rpx" />
      </view>
    </view>

    <!-- 地图标题行 -->
    <view class="map-head">
      <view class="mh-left">
        <!-- 省级地图时显示返回全国按钮 -->
        <view v-if="view === 'province'" class="mh-back" @click="backToNation">
          <Icon name="chevron-left" color="#1A2E2A" :weight="2" size="32rpx" />
        </view>
        <text class="mh-title">{{ view === 'nation' ? '中国足迹地图' : currentProvince?.name }}</text>
      </view>
      <view v-if="view === 'nation'" class="legend">
        <view class="legend-item">
          <view class="dot dot-visited" />
          <text class="legend-txt">已到访</text>
        </view>
        <view class="legend-item">
          <view class="dot dot-planned" />
          <text class="legend-txt">规划中</text>
        </view>
      </view>
      <text v-else class="legend-txt">点击标注点查看详情</text>
    </view>

    <!-- 地图卡 -->
    <view class="map-card">
      <!-- 第一级：全国地图（点击省份进入） -->
      <view v-if="view === 'nation'" class="nation-map">
        <ChinaMap
          :cities="[]"
          :lit-count="visitedCount"
          :show-footer="false"
          variant="plain"
        >
          <!-- 有标注点的省份标记：可点击进入对应省级地图 -->
          <template #overlay>
            <view
              v-for="pg in provinceGroups"
              :key="pg.id"
              class="province-badge"
              :style="{ left: pg.pos.left, top: pg.pos.top }"
              @tap="onEnterProvince(pg.id)"
            >
              <view class="province-wave" />
              <view class="province-dot" />
              <text class="province-name">{{ pg.name }}</text>
              <text class="province-count">{{ pg.count }} 个标注点</text>
            </view>
          </template>
        </ChinaMap>
        <view class="nation-hint">
          <text>点击省份查看标注点</text>
          <Icon name="chevron-right" color="#2E9E6B" :weight="2" size="22rpx" />
        </view>
      </view>

      <!-- 第二级：省级地图（点击标点显示气泡） -->
      <ChinaMap
        v-else
        :cities="mapCities"
        :lit-count="visitedCount"
        :show-footer="false"
        variant="province"
        :province-id="currentProvinceId || ''"
        :active-id="activeId || ''"
        @pin-tap="onPinTap"
      >
        <!-- 点位浮层：仅在点击标点后显示，锚定选中点位上方 -->
        <template #overlay>
          <view
            v-if="activeSpot && activePos"
            class="spot-popup"
            :style="{ left: activePos.left, top: activePos.top }"
          >
            <text class="sp-title">{{ activeSpot.locationName }}</text>
            <text class="sp-meta">{{ dateText(activeSpot) }} · {{ activeSpot.journalCount || 0 }} 篇游记</text>
            <view class="sp-line" />
            <view class="sp-action" @click="toDetail">
              <text class="sp-action-txt">查看详情</text>
              <Icon class="sp-chev" name="chevron-right" color="#2E9E6B" :weight="2" size="24rpx" />
            </view>
          </view>
        </template>
      </ChinaMap>
    </view>

    <!-- 已添加地点 -->
    <view class="list-head">
      <text class="lh-title">已添加地点</text>
      <text class="lh-count">共 {{ spots.length }} 个</text>
    </view>

    <view class="list-card">
      <view v-if="!loading && !spots.length" class="list-empty">
        <Icon name="pin" color="#C4CCC6" :weight="1.6" size="56rpx" />
        <text class="le-title">还没有标注点</text>
        <text class="le-sub">点击下方按钮，选一个去过的或想去的地方</text>
      </view>
      <view v-for="(s, i) in spots" :key="s.id" class="row" @click="pick(s)">
        <view class="row-icon" :class="s.markStatus === 'visited' ? 'ic-visited' : 'ic-planned'">
          <Icon
            name="pin"
            :color="s.markStatus === 'visited' ? '#2E9E6B' : '#D98C3F'"
            :weight="1.6"
            size="36rpx"
          />
        </view>
        <view class="row-main">
          <text class="row-name">{{ s.locationName }}</text>
          <text class="row-sub">{{ dateText(s) }} · {{ s.journalCount || 0 }} 篇游记</text>
        </view>
        <view class="pill" :class="s.markStatus === 'visited' ? 'pill-visited' : 'pill-planned'">
          <text class="pill-txt" :class="s.markStatus === 'visited' ? 'pill-txt-visited' : 'pill-txt-planned'">
            {{ s.markStatus === 'visited' ? '已到访' : '规划中' }}
          </text>
        </view>
        <Icon class="row-chev" name="chevron-right" color="#C4CCC6" size="32rpx" />
        <view v-if="i < spots.length - 1" class="row-line" />
      </view>
    </view>

    <!-- 悬浮在底部的添加入口 -->
    <view class="footer-fixed">
      <view class="add-btn" :class="{ busy: picking }" @click="openAdd">
        <Icon name="plus" color="#FFFFFF" :weight="1.9" size="32rpx" />
        <text class="add-txt">{{ picking ? '定位中…' : '添加标注点' }}</text>
      </view>
    </view>

    <!-- 新增标注点确认面板：选完地址后补充状态 / 日期 / 旅行册 -->
    <view v-if="showAdd && picked" class="mask" @click="showAdd = false">
      <view class="sheet" @click.stop>
        <view class="sheet-head">
          <text class="sheet-title">添加标注点</text>
          <view class="sheet-close" @click="showAdd = false">
            <Icon name="close" color="#8A9B92" :weight="1.8" size="32rpx" />
          </view>
        </view>

        <!-- 已选地址（点「重选」回到微信地图） -->
        <view class="addr-card" @click="rechoose">
          <view class="addr-icon">
            <Icon name="pin" color="#2E9E6B" :weight="1.7" size="34rpx" />
          </view>
          <view class="addr-main">
            <text class="addr-name">{{ picked.name }}</text>
            <text class="addr-detail">{{ picked.address || '已选中位置' }}</text>
          </view>
          <text class="addr-redo">重选</text>
        </view>

        <!-- 状态 -->
        <view class="fld">
          <text class="fld-label">状态</text>
          <view class="seg">
            <view class="seg-item" :class="{ active: addStatus === 'visited' }" @click="addStatus = 'visited'">
              已到访
            </view>
            <view class="seg-item" :class="{ active: addStatus === 'planned' }" @click="addStatus = 'planned'">
              规划中
            </view>
          </view>
        </view>

        <!-- 到访日期 -->
        <view v-if="addStatus === 'visited'" class="fld">
          <text class="fld-label">到访日期</text>
          <picker mode="date" :value="addDate" @change="onDateChange">
            <view class="fld-value">
              <text>{{ addDate }}</text>
              <Icon name="calendar" color="#9DB8A5" :weight="1.6" size="30rpx" />
            </view>
          </picker>
        </view>

        <!-- 所属旅行册（页面锁定某本时不显示） -->
        <view v-if="!lockedBookId" class="fld">
          <text class="fld-label">所属旅行册</text>
          <picker mode="selector" :range="books" range-key="name" :value="bookIndex" @change="onBookChange">
            <view class="fld-value" :class="{ empty: !addBookName }">
              <text>{{ addBookName || '请选择' }}</text>
              <Icon name="chevron-down" color="#9DB8A5" :weight="1.8" size="24rpx" />
            </view>
          </picker>
        </view>

        <view class="sheet-btn" :class="{ disabled: saving }" @click="confirmAdd">
          {{ saving ? '保存中…' : '保存标注点' }}
        </view>
      </view>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.spots-page {
  min-height: 100vh;
  background: #f5f7f5;
  display: flex;
  flex-direction: column;
  /* 底部留出悬浮按钮的高度，列表最后一项不会被遮住 */
  padding: 0 32rpx calc(200rpx + env(safe-area-inset-bottom));
  box-sizing: border-box;
}

/* 高度由 utils/safe-area.ts 按机型注入 */
.status-bar {
  width: 100%;
}

/* 导航 */
.nav {
  display: flex;
  align-items: center;
  height: 104rpx;
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
  .nav-locate {
    margin-left: auto;
    width: 64rpx;
    height: 64rpx;
    display: flex;
    align-items: center;
    justify-content: center;
  }
}

/* 地图标题 */
.map-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 40rpx;
  margin-top: 12rpx;
  .mh-left {
    display: flex;
    align-items: center;
    gap: 4rpx;
  }
  .mh-back {
    width: 44rpx;
    height: 40rpx;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .mh-title {
    font-size: 26rpx;
    font-weight: 600;
    color: #1a2e2a;
  }
  .legend-txt {
    font-size: 22rpx;
    color: #6b756f;
  }
}
.legend {
  display: flex;
  align-items: center;
  gap: 24rpx;
}
.legend-item {
  display: flex;
  align-items: center;
  gap: 10rpx;
  .legend-txt {
    font-size: 22rpx;
    color: #6b756f;
  }
}
.dot {
  width: 14rpx;
  height: 14rpx;
  border-radius: 7rpx;
}
.dot-visited {
  background: #2e9e6b;
}
.dot-planned {
  background: #d98c3f;
}

/* 全国地图（第一级） */
.nation-map {
  position: relative;
  cursor: pointer;
}
.nation-hint {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4rpx;
  padding: 20rpx 0 8rpx;
  font-size: 24rpx;
  color: #2e9e6b;
  font-weight: 500;
}

/* 省份标记（全国地图上可点击进入） */
.province-badge {
  position: absolute;
  transform: translate(-50%, -50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  .province-wave {
    position: absolute;
    top: 0;
    width: 48rpx;
    height: 48rpx;
    border-radius: 50%;
    border: 4rpx solid #2e9e6b;
    box-sizing: border-box;
    animation: province-ripple 2.4s ease-out infinite;
  }
  .province-dot {
    width: 22rpx;
    height: 22rpx;
    border-radius: 50%;
    background: #2e9e6b;
    margin-top: 13rpx;
    box-shadow: 0 0 0 6rpx rgba(46, 158, 107, 0.2);
  }
  .province-name {
    margin-top: 10rpx;
    font-size: 26rpx;
    font-weight: 700;
    color: #1a2e2a;
    background: #ffffff;
    padding: 2rpx 14rpx;
    border-radius: 16rpx;
    box-shadow: 0 4rpx 12rpx rgba(26, 46, 42, 0.12);
  }
  .province-count {
    margin-top: 6rpx;
    font-size: 20rpx;
    color: #6b756f;
  }
}
@keyframes province-ripple {
  0% {
    width: 48rpx;
    height: 48rpx;
    opacity: 0.8;
  }
  100% {
    width: 120rpx;
    height: 120rpx;
    opacity: 0;
  }
}

/* 地图卡 */
.map-card {
  position: relative;
  margin-top: 16rpx;
  padding: 0 32rpx;
  box-sizing: border-box;
  border-radius: 40rpx;
  overflow: hidden;
  background: linear-gradient(180deg, #e9f4ee 0%, #d5e6dc 100%);

  /* 地图组件自带的上间距在卡片内不需要 */
  :deep(.china-map-wrap) {
    margin-top: 0;
  }
}

/* 点位浮层 */
.spot-popup {
  position: absolute;
  min-width: 280rpx;
  max-width: 320rpx;
  padding: 24rpx 26rpx;
  background: #ffffff;
  border-radius: 20rpx;
  box-shadow: 0 10rpx 34rpx rgba(26, 46, 42, 0.16);
  /* 锚在点位正上方，留出与圆环之间的间隙（设计稿 ~19pt） */
  transform: translate(-50%, calc(-100% - 38rpx));
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  z-index: 20;

  /* 底部指向箭头 */
  &::after {
    content: '';
    position: absolute;
    left: 50%;
    bottom: -12rpx;
    width: 24rpx;
    height: 24rpx;
    background: #ffffff;
    transform: translateX(-50%) rotate(45deg);
    border-radius: 4rpx;
    box-shadow: 6rpx 6rpx 12rpx rgba(26, 46, 42, 0.08);
  }

  .sp-title {
    font-size: 26rpx;
    font-weight: 600;
    line-height: 1.4;
    color: #1a2e2a;
  }
  .sp-meta {
    margin-top: 12rpx;
    font-size: 20rpx;
    line-height: 1.4;
    color: #6b756f;
  }
  .sp-line {
    width: 100%;
    height: 1rpx;
    background: #f0f3f1;
    margin: 4rpx 0;
  }
  .sp-action {
    display: flex;
    align-items: center;
    gap: 4rpx;
  }
  .sp-action-txt {
    font-size: 20rpx;
    font-weight: 500;
    color: #2e9e6b;
  }
  .sp-chev {
    width: 24rpx;
    height: 24rpx;
  }
}

/* 列表 */
.list-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 40rpx;
  margin: 28rpx 0 16rpx;
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

.list-card {
  background: #ffffff;
  border-radius: 32rpx;
  padding: 0 32rpx;
}

.list-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 72rpx 0 76rpx;
  .le-title {
    margin-top: 20rpx;
    font-size: 28rpx;
    font-weight: 500;
    color: #7d8d84;
  }
  .le-sub {
    margin-top: 10rpx;
    font-size: 22rpx;
    color: #a8b6ad;
    text-align: center;
    line-height: 1.5;
  }
}
.row {
  position: relative;
  display: flex;
  align-items: center;
  height: 120rpx;
}
.row-icon {
  width: 72rpx;
  height: 72rpx;
  border-radius: 22rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  &.ic-visited {
    background: #eaf3ec;
  }
  &.ic-planned {
    background: #fdf1e8;
  }
}
.row-svg {
  width: 36rpx;
  height: 36rpx;
}
.row-main {
  margin-left: 24rpx;
  display: flex;
  flex-direction: column;
  gap: 6rpx;
  .row-name {
    font-size: 26rpx;
    font-weight: 500;
    color: #1a2e2a;
  }
  .row-sub {
    font-size: 22rpx;
    color: #9aa39d;
  }
}
.pill {
  margin-left: auto;
  height: 40rpx;
  padding: 0 16rpx;
  border-radius: 20rpx;
  display: flex;
  align-items: center;
  &.pill-visited {
    background: #eaf3ec;
  }
  &.pill-planned {
    background: #fdf1e8;
  }
  .pill-txt {
    font-size: 21rpx;
    font-weight: 500;
  }
  .pill-txt-visited {
    color: #2e9e6b;
  }
  .pill-txt-planned {
    color: #c97b32;
  }
}
.row-chev {
  width: 32rpx;
  height: 32rpx;
  margin-left: 8rpx;
}
.row-line {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 1rpx;
  background: #f0f3f1;
}

/* 底部悬浮按钮：不占文档流，列表可滚到它下方 */
.footer-fixed {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 90;
  padding: 36rpx 32rpx calc(24rpx + env(safe-area-inset-bottom));
  background: linear-gradient(
    to bottom,
    rgba(245, 247, 245, 0) 0%,
    rgba(245, 247, 245, 0.9) 42%,
    #f5f7f5 100%
  );
}
.add-btn {
  height: 104rpx;
  border-radius: 52rpx;
  background: #2e9e6b;
  box-shadow: 0 14rpx 34rpx rgba(46, 158, 107, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10rpx;
  transition: opacity 0.16s;
  &.busy {
    opacity: 0.7;
  }
  &:active {
    opacity: 0.86;
  }
  .add-txt {
    font-size: 30rpx;
    font-weight: 600;
    color: #ffffff;
  }
}

/* 新增标注点确认面板 */
.mask {
  position: fixed;
  inset: 0;
  background: rgba(16, 30, 26, 0.45);
  display: flex;
  align-items: flex-end;
  z-index: 200;
}
.sheet {
  width: 100%;
  background: #ffffff;
  border-radius: 40rpx 40rpx 0 0;
  padding: 36rpx 32rpx calc(40rpx + env(safe-area-inset-bottom));
  box-sizing: border-box;

  .sheet-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 28rpx;
  }
  .sheet-title {
    font-size: 32rpx;
    font-weight: 600;
    color: #1a2e2a;
  }
  .sheet-close {
    width: 56rpx;
    height: 56rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-right: -12rpx;
  }

  /* 已选地址 */
  .addr-card {
    display: flex;
    align-items: center;
    gap: 20rpx;
    padding: 24rpx;
    border-radius: 24rpx;
    background: #f3f8f4;
  }
  .addr-icon {
    width: 64rpx;
    height: 64rpx;
    border-radius: 20rpx;
    background: #e2f0e8;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }
  .addr-main {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 6rpx;
  }
  .addr-name {
    font-size: 28rpx;
    font-weight: 600;
    color: #1a2e2a;
    line-height: 1.3;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .addr-detail {
    font-size: 22rpx;
    color: #7d9a89;
    line-height: 1.4;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .addr-redo {
    flex-shrink: 0;
    font-size: 24rpx;
    font-weight: 500;
    color: #2e9e6b;
  }

  /* 表单行 */
  .fld {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 24rpx;
    min-height: 104rpx;
    border-bottom: 1rpx solid #f0f3f1;
  }
  .fld-label {
    font-size: 28rpx;
    color: #4a5752;
    flex-shrink: 0;
  }
  .fld-value {
    display: flex;
    align-items: center;
    gap: 8rpx;
    font-size: 28rpx;
    color: #1a2e2a;
    &.empty {
      color: #b3c1b8;
    }
  }

  /* 状态分段 */
  .seg {
    display: flex;
    padding: 4rpx;
    border-radius: 20rpx;
    background: #f2f5f2;
  }
  .seg-item {
    padding: 12rpx 26rpx;
    border-radius: 16rpx;
    font-size: 26rpx;
    color: #7d8d84;
    transition: all 0.16s;
    &.active {
      background: #ffffff;
      color: #1f4d3a;
      font-weight: 600;
      box-shadow: 0 2rpx 8rpx rgba(26, 46, 42, 0.08);
    }
  }

  .sheet-btn {
    margin-top: 36rpx;
    height: 100rpx;
    border-radius: 50rpx;
    background: #2e9e6b;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 30rpx;
    font-weight: 600;
    color: #ffffff;
    &.disabled {
      opacity: 0.65;
    }
    &:active {
      opacity: 0.88;
    }
  }
}
</style>
