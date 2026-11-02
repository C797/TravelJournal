<!-- 中国地图（矢量底图 + DOM 点位/标签）
     底图由 china-map-data.ts 的省份路径离屏渲染成静态 PNG（static/map/*.png），
     这里不再用 canvas —— 小程序端 canvas 是原生层，会盖住浮在它上面的 DOM 弹窗，
     而且 canvas 高宽比和容器不一致时会被拉伸变形。改用 image 铺底后：
       · 底图等比不变形（容器严格按 1000:738 设比例）
       · 点位 / 城市名 / 弹窗都是普通 view，层级正常、文字也清晰 -->
<script setup lang="ts">
import { computed } from 'vue'
import Icon from './Icon.vue'
import { project, projectProvince, provinceViewBox } from '@/utils/map-projection'
import { provinces, provinceBounds } from './china-map-data'
import type { ProvinceBounds } from '@/utils/map-projection'

interface FootprintCity {
  name: string
  status: 'visited' | 'planned'
  lng: number
  lat: number
  /** 可选的唯一标识，用于选中态与点击回调（标注点管理页传 spot id） */
  id?: string
}

const props = withDefaults(
  defineProps<{
    cities: FootprintCity[]
    litCount: number
    /** 是否显示底部「已点亮 N 个城市 / 查看地图」信息 */
    showFooter?: boolean
    /** default：浅绿陆地 + 城市名；plain：白陆地 + 纯点位（标注点管理页）；province：省级地图 */
    variant?: 'default' | 'plain' | 'province'
    /** 当前选中的点位 id（plain/province 变体用于高亮选中） */
    activeId?: string
    /** province 模式下必传：省份 id（如 CNSN / CNSC），用于渲染对应省级底图 */
    provinceId?: string
  }>(),
  { showFooter: true }
)

const emit = defineEmits<{
  /** 点击点位时触发，携带点位 id（无 id 时回退为 name） */
  (e: 'pin-tap', key: string): void
}>()

// 与 simplemaps viewBox 一致
const MAP_W = 1000
const MAP_H = 738

const isPlain = computed(() => props.variant === 'plain')
const isProvince = computed(() => props.variant === 'province')

// 当前省份的 path 与包围盒（province 模式）
const province = computed(() => {
  if (!isProvince.value || !props.provinceId) return null
  const p = provinces.find((x) => x.id === props.provinceId)
  const b = provinceBounds[props.provinceId]
  if (!p || !b) return null
  return { ...p, bounds: b }
})

// 省级地图 viewBox（含边距）
const provinceVb = computed(() => {
  if (!province.value) return { x: 0, y: 0, w: MAP_W, h: MAP_H }
  return provinceViewBox(province.value.bounds)
})

// 运行时生成省级 SVG 底图，转 base64 data URI。
// 小程序 <image> 支持 base64，但不支持动态 SVG data URI（未编码的原始 svg 字符串）。
// 注意：不能用 btoa/unescape/encodeURIComponent —— 小程序 JS 运行时不保证有 btoa/atob，
// 这里手写纯 ASCII base64（SVG 内容仅含 path 数据、数字、字母与符号，无多字节字符）。
const BASE64_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
function asciiToBase64(input: string) {
  let out = ''
  let i = 0
  for (; i + 2 < input.length; i += 3) {
    const n = (input.charCodeAt(i) << 16) | (input.charCodeAt(i + 1) << 8) | input.charCodeAt(i + 2)
    out += BASE64_CHARS[(n >> 18) & 63] + BASE64_CHARS[(n >> 12) & 63] + BASE64_CHARS[(n >> 6) & 63] + BASE64_CHARS[n & 63]
  }
  const rest = input.length - i
  if (rest === 1) {
    const n = input.charCodeAt(i) << 16
    out += BASE64_CHARS[(n >> 18) & 63] + BASE64_CHARS[(n >> 12) & 63] + '=='
  } else if (rest === 2) {
    const n = (input.charCodeAt(i) << 16) | (input.charCodeAt(i + 1) << 8)
    out += BASE64_CHARS[(n >> 18) & 63] + BASE64_CHARS[(n >> 12) & 63] + BASE64_CHARS[(n >> 6) & 63] + '='
  }
  return out
}

function svgToDataUri(svg: string) {
  return 'data:image/svg+xml;base64,' + asciiToBase64(svg)
}

const mapSrc = computed(() => {
  if (isProvince.value && province.value) {
    const vb = provinceVb.value
    const path = province.value.d
    const svg =
      `<svg xmlns="http://www.w3.org/2000/svg" width="${vb.w}" height="${vb.h}" viewBox="${vb.x} ${vb.y} ${vb.w} ${vb.h}">` +
      `<path d="${path}" fill="#DDEBE2" stroke="#FFFFFF" stroke-width="3" stroke-linejoin="round"/>` +
      `</svg>`
    return svgToDataUri(svg)
  }
  return isPlain.value ? '/static/map/china-plain.png' : '/static/map/china-default.png'
})

const points = computed(() =>
  props.cities.map((c) => ({
    name: c.name,
    status: c.status,
    color: c.status === 'visited' ? '#2E9E6B' : '#D98C3F',
    key: c.id ?? c.name,
    pos:
      isProvince.value && province.value
        ? projectProvince(c.lng, c.lat, province.value.bounds)
        : project(c.lng, c.lat)
  }))
)

function onPinTap(p: { key: string }) {
  emit('pin-tap', p.key)
}

function goFootprint() {
  uni.navigateTo({ url: '/pages/spots/index' })
}
</script>

<template>
  <view class="china-map-wrap">
    <!-- 地图舞台：宽高严格按底图比例，保证底图与点位坐标同一坐标系 -->
    <view
      class="map-stage"
      :class="isProvince ? 'is-province' : isPlain ? 'is-plain' : 'is-default'"
      :style="isProvince ? { aspectRatio: `${provinceVb.w} / ${provinceVb.h}` } : {}"
    >
      <image
        class="map-bg"
        :class="{ 'is-province-bg': isProvince }"
        :src="mapSrc"
        :mode="isProvince ? 'aspectFit' : 'widthFix'"
      />

      <view
        v-for="p in points"
        :key="p.key"
        class="pin"
        :class="{ 'is-active': (isPlain || isProvince) && activeId === p.key }"
        :style="p.pos"
        @tap="onPinTap(p)"
      >
        <template v-if="isPlain || isProvince">
          <view class="pin-wave" :style="{ borderColor: p.color }" />
          <view class="pin-ring" :style="{ borderColor: p.color }" />
          <view class="pin-dot-core" :style="{ background: p.color }" />
        </template>
        <template v-else>
          <view class="pin-wave" :style="{ borderColor: p.color }" />
          <view class="pin-halo" :style="{ background: p.color }" />
          <view class="pin-dot" :style="{ background: p.color }" />
          <text class="pin-label">{{ p.name }}</text>
        </template>
      </view>

      <!-- 上层浮层（点位弹窗等） -->
      <slot name="overlay" />
    </view>

    <!-- 底部信息 -->
    <view v-if="showFooter !== false" class="map-footer">
      <text class="lit-text">已点亮 {{ litCount }} 个城市</text>
      <view class="view-map" @click="goFootprint">
        <text>查看地图</text>
        <Icon name="chevron-right" color="#2E9E6B" :weight="2" size="22rpx" />
      </view>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.china-map-wrap {
  width: 100%;
  margin-top: 16rpx;
}

/* 底图作为文档流元素，用 widthFix 让图片按宽度等比撑开高度；
   点位/弹窗再绝对定位到这张图上，坐标与 1000:738 一致 */
.map-stage {
  position: relative;
  width: 100%;
  line-height: 0;
}

/* 底图：正常文档流，宽度 100%，高度由 widthFix 等比得出 */
.map-bg {
  display: block;
  width: 100%;
}

/* 省级底图：stage 由 aspect-ratio 撑出高度，底图绝对铺满 */
.map-stage.is-province .map-bg.is-province-bg {
  position: absolute;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
}

/* 点位：0 尺寸锚点，子元素围绕锚点居中对齐 */
.pin {
  position: absolute;
  width: 0;
  height: 0;
}

/* 波纹扩散环（两个变体共用）：从中心向外扩散的呼吸波纹 */
.pin-wave {
  position: absolute;
  left: 0;
  top: 0;
  width: 24rpx;
  height: 24rpx;
  border-radius: 50%;
  border: 4rpx solid #2e9e6b;
  box-sizing: border-box;
  opacity: 0.7;
  transform: translate(-50%, -50%);
  animation: pin-wave-ripple 2.4s ease-out infinite;
}

@keyframes pin-wave-ripple {
  0% {
    width: 24rpx;
    height: 24rpx;
    opacity: 0.7;
  }
  100% {
    width: 96rpx;
    height: 96rpx;
    opacity: 0;
  }
}

/* 首页：实心圆点 + 柔光晕，城市名在圆点正下方 */
.map-stage.is-default {
  .pin-dot {
    position: absolute;
    left: 0;
    top: 0;
    width: 24rpx;
    height: 24rpx;
    border-radius: 50%;
    transform: translate(-50%, -50%);
  }
  .pin-halo {
    position: absolute;
    left: 0;
    top: 0;
    width: 48rpx;
    height: 48rpx;
    border-radius: 50%;
    opacity: 0.18;
    transform: translate(-50%, -50%);
    animation: pin-halo-breathe 2.4s ease-in-out infinite;
  }
  .pin-label {
    position: absolute;
    left: 0;
    top: 0;
    transform: translate(-50%, 14rpx);
    font-size: 18rpx;
    line-height: 1.2;
    color: #1f2e29;
    white-space: nowrap;
  }
}

@keyframes pin-halo-breathe {
  0%,
  100% {
    opacity: 0.1;
    transform: translate(-50%, -50%) scale(0.8);
  }
  50% {
    opacity: 0.28;
    transform: translate(-50%, -50%) scale(1.2);
  }
}

/* 标注点管理 / 省级地图：空心描边圆环 + 中心实心核 + 波纹 */
.map-stage.is-plain,
.map-stage.is-province {
  .pin {
    /* 扩大可点击区域，方便点选密集点位 */
    width: 56rpx;
    height: 56rpx;
    transform: translate(-50%, -50%);
  }

  .pin-ring {
    position: absolute;
    left: 50%;
    top: 50%;
    width: 33rpx;
    height: 33rpx;
    box-sizing: border-box;
    border: 5rpx solid #2e9e6b;
    border-radius: 50%;
    transform: translate(-50%, -50%);
    background: #ffffff;
  }
  .pin-dot-core {
    position: absolute;
    left: 50%;
    top: 50%;
    width: 10rpx;
    height: 10rpx;
    border-radius: 50%;
    transform: translate(-50%, -50%);
  }
  .pin-wave {
    left: 50%;
    top: 50%;
  }

  /* 选中态：放大圆环 + 增强波纹 */
  .pin.is-active {
    .pin-ring {
      border-width: 6rpx;
      width: 40rpx;
      height: 40rpx;
    }
    .pin-wave {
      animation-duration: 1.6s;
      opacity: 0.9;
    }
  }
}

.map-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 12rpx;

  .lit-text {
    font-weight: 700;
    font-size: 28rpx;
    color: #2d5240;
  }
  .view-map {
    display: flex;
    align-items: center;
    gap: 4rpx;
    color: #2e9e6b;
    font-size: 26rpx;
    font-weight: 500;
  }
}
</style>
