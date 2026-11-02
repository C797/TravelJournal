<!-- 跨端线性图标：以 data-uri 背景图渲染，H5 与小程序（WXML 无 svg）均可显示
     图形与设计稿（Ardot 画板）同一套：24 网格 / 1.7 线宽 / 圆头圆角 -->
<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    /** 内置图标名 */
    name?: string
    /** 直接传入单条 path 的 d（数据驱动图标） */
    d?: string
    /** 图标颜色 */
    color?: string
    /** 尺寸，支持 rpx/px 字符串 */
    size?: string
    /** 线宽 */
    weight?: number
    /** 是否圆角端点 */
    round?: boolean
  }>(),
  { color: '#1A2E2A', size: '40rpx', weight: 1.7, round: true }
)

const INNER: Record<string, string> = {
  // ---------- 方向 / 基础 ----------
  'chevron-left': '<path d="m15 5-7 7 7 7"/>',
  'chevron-right': '<path d="m9 5 7 7-7 7"/>',
  'chevron-down': '<path d="m6 9 6 6 6-6"/>',
  'chevron-up': '<path d="m6 15 6-6 6 6"/>',
  'arrow-left': '<path d="M19.5 12H4.5M10 5.5 4 12l6 6.5"/>',
  'arrow-right': '<path d="M4.5 12h15M14 5.5 20 12l-6 6.5"/>',
  'arrow-down': '<path d="M12 4.5v14M12 18.5 6.5 13M12 18.5l5.5-5.5"/>',
  'arrow-up': '<path d="M12 19.5v-14M12 5.5 6.5 11M12 5.5l5.5 5.5"/>',
  plus: '<path d="M12 5.5v13M5.5 12h13"/>',
  close: '<path d="M6 6l12 12M18 6 6 18"/>',
  check: '<path d="m5.5 12.5 4.2 4.2 8.8-8.9"/>',
  dots: '<circle cx="6.2" cy="12" r="1.4"/><circle cx="12" cy="12" r="1.4"/><circle cx="17.8" cy="12" r="1.4"/>',

  // ---------- 底部 Tab（与画板 18 网格等比放大到 24） ----------
  home: '<path d="M4 12 12 4l8 8"/><path d="M6.7 10.7v9.3h10.6v-9.3"/>',
  list: '<rect x="4" y="5.3" width="16" height="14.7" rx="1.6"/><path d="M6.9 9.4h10.2M6.9 13.2h10.2"/>',
  card: '<rect x="2.7" y="4" width="18.6" height="16" rx="2.8"/><path d="M2.7 9.3h18.6"/>',
  user: '<circle cx="12" cy="8" r="4.6"/><path d="M4.6 19.4c0-3.4 3.3-5.3 7.4-5.3s7.4 1.9 7.4 5.3"/>',

  // ---------- 我的（内容 / 服务） ----------
  album: '<rect x="3.6" y="3.6" width="16.8" height="16.8" rx="4.2"/><rect x="9.2" y="9.2" width="5.6" height="5.6" rx="1.7"/>',
  doc: '<rect x="5.2" y="3.6" width="13.6" height="16.8" rx="2.2"/><path d="M8.6 8.6h6.8M8.6 12h6.8M8.6 15.4h4"/>',
  pin: '<path d="M20 10.4c0 5.3-8 11.7-8 11.7S4 15.7 4 10.4a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10.3" r="2.6"/>',
  wallet: '<rect x="3.4" y="6" width="17.2" height="13" rx="3"/><path d="M7 12.5h3.6"/>',
  download: '<path d="M12 3.6v10.8M12 14.6 7.8 10.4M12 14.6l4.2-4.2M5 19.8h14"/>',
  sun: '<circle cx="12" cy="12" r="3.5"/><path d="M12 3.2v2M12 18.8v2M3.2 12h2M18.8 12h2M5.9 5.9l1.4 1.4M16.7 16.7l1.4 1.4M5.9 18.1l1.4-1.4M16.7 7.3l1.4-1.4"/>',
  locate:
    '<circle cx="12" cy="12" r="6.3"/><circle cx="12" cy="12" r="2.2"/><path d="M12 2.6v2.4M12 19v2.4M2.6 12H5M19 12h2.4"/>',

  // ---------- 记账分类（与画板一致） ----------
  bowl: '<path d="M4.6 11.6h14.8a7.4 7.4 0 0 1-14.8 0Z"/><path d="M9.2 8.6c.9-1 .9-2.1 0-3.1M14.2 8.6c.9-1 .9-2.1 0-3.1"/>',
  send: '<path d="M20.8 3.2 3.4 9.9l6.9 3 2.8 6.8 7.7-16.5Z"/><path d="M20.8 3.2 10.3 12.9"/>',
  house: '<path d="M3.9 10.4 12 3.7l8.1 6.7V19a1.5 1.5 0 0 1-1.5 1.5H5.4A1.5 1.5 0 0 1 3.9 19v-8.6Z"/><path d="M9.7 20.5v-5.8h4.6v5.8"/>',
  triangle: '<path d="M12 4.7 20 19.3H4L12 4.7Z"/>',
  bag: '<path d="M5.5 8.7h13l-1 11.3h-11l-1-11.3Z"/><path d="M9.2 8.7V6.9a2.8 2.8 0 0 1 5.6 0v1.8"/>',

  // ---------- 功能 ----------
  search: '<circle cx="10.8" cy="10.8" r="6.2"/><path d="m15.5 15.5 4.2 4.2"/>',
  bell: '<path d="M18 9.3a6 6 0 1 0-12 0c0 4.5-2 5.7-2 5.7h16s-2-1.2-2-5.7Z"/><path d="M10.2 19.4a2 2 0 0 0 3.6 0"/>',
  heart: '<path d="M12 20.2S5.2 15.9 5.2 10.9A3.8 3.8 0 0 1 12 8.7a3.8 3.8 0 0 1 6.8 2.2c0 5-6.8 9.3-6.8 9.3Z"/>',
  filter: '<path d="M4 6.6h16M7 12h10M10.4 17.4h3.2"/>',
  share: '<circle cx="17.4" cy="6" r="2.6"/><circle cx="6.6" cy="12" r="2.6"/><circle cx="17.4" cy="18" r="2.6"/><path d="m8.9 10.7 6.2-3.4M8.9 13.3l6.2 3.4"/>',
  camera:
    '<path d="M4.6 8h3.1l1.5-2.4h5.6L16.3 8h3.1a1.6 1.6 0 0 1 1.6 1.6v8.6a1.6 1.6 0 0 1-1.6 1.6H4.6A1.6 1.6 0 0 1 3 18.2V9.6A1.6 1.6 0 0 1 4.6 8Z"/><circle cx="12" cy="13.6" r="3.3"/>',
  trash: '<path d="M4.5 6.6h15M9.6 6.6V4.8h4.8v1.8M6.6 6.6l.9 13.1h9l.9-13.1"/>',
  edit: '<path d="M4.6 19.4h4l9.8-9.8a2.1 2.1 0 0 0-3-3l-9.8 9.8v3Z"/><path d="m14.4 6.6 3 3"/>',
  calendar:
    '<rect x="3.8" y="5.2" width="16.4" height="15" rx="2.6"/><path d="M3.8 10h16.4M8.4 3.4v3.2M15.6 3.4v3.2"/>',
  book: '<rect x="4" y="4" width="16" height="16" rx="2.2"/><path d="M8 4v16"/><path d="M11 9h6M11 13h4"/>',
  info: '<circle cx="12" cy="12" r="8.2"/><path d="M12 10.8v5.4M12 7.8h.01"/>',
  help: '<circle cx="12" cy="12" r="8.2"/><path d="M9.8 9.6a2.3 2.3 0 1 1 3.2 2.1c-.7.3-1 .9-1 1.6M12 16.4h.01"/>'
}

const bg = computed(() => {
  const inner = props.d ? `<path d="${props.d}"/>` : INNER[props.name || ''] || ''
  const cap = props.round ? 'round' : 'butt'
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" ` +
    `stroke="${props.color}" stroke-width="${props.weight}" stroke-linecap="${cap}" stroke-linejoin="round">` +
    inner +
    `</svg>`
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`
})
</script>

<template>
  <view class="tj-icon" :style="{ width: size, height: size, backgroundImage: bg }" />
</template>

<style scoped>
.tj-icon {
  display: inline-block;
  flex-shrink: 0;
  background-repeat: no-repeat;
  background-position: center;
  background-size: 100% 100%;
}
</style>
