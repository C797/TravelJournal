<!-- 折线图（Canvas 绘制，H5 与小程序通用；WXML 不支持 svg） -->
<script setup lang="ts">
import { getCurrentInstance, onMounted, ref, watch, nextTick } from 'vue'

const props = withDefaults(
  defineProps<{
    values: number[]
    /** 画布高度，如 184rpx */
    height?: string
    color?: string
    /** 每几个点画一个圆点 */
    dotStep?: number
  }>(),
  { height: '184rpx', color: '#2E9E6B', dotStep: 4 }
)

const VIEW_W = 300
const VIEW_H = 120
const canvasId = 'tj-line-chart'
const ctx = ref<CanvasRenderingContext2D | null>(null)

function points() {
  const max = Math.max(...props.values, 1)
  return props.values.map((v, i) => ({
    x: (i / (props.values.length - 1)) * VIEW_W,
    y: VIEW_H - 14 - (v / max) * (VIEW_H - 40)
  }))
}

function draw() {
  const c = ctx.value
  if (!c) return
  c.clearRect(0, 0, VIEW_W, VIEW_H)

  // 虚线基线
  c.save()
  c.beginPath()
  c.setLineDash([5, 5])
  c.moveTo(0, VIEW_H - 14)
  c.lineTo(VIEW_W, VIEW_H - 14)
  c.strokeStyle = '#E7EEE9'
  c.lineWidth = 1
  c.stroke()
  c.restore()

  const pts = points()

  // 折线
  c.save()
  c.beginPath()
  pts.forEach((p, i) => (i === 0 ? c.moveTo(p.x, p.y) : c.lineTo(p.x, p.y)))
  c.strokeStyle = props.color
  c.lineWidth = 2
  c.lineJoin = 'round'
  c.lineCap = 'round'
  c.stroke()
  c.restore()

  // 圆点
  pts.forEach((p, i) => {
    if (i % props.dotStep !== 0 && i !== pts.length - 1) return
    c.save()
    c.beginPath()
    c.arc(p.x, p.y, 3, 0, Math.PI * 2)
    c.fillStyle = '#FFFFFF'
    c.fill()
    c.lineWidth = 2
    c.strokeStyle = props.color
    c.stroke()
    c.restore()
  })
}

function init() {
  // #ifdef MP-WEIXIN
  const ins = getCurrentInstance()
  const query: any = uni.createSelectorQuery().in(ins?.proxy)
  query
    .select('#' + canvasId)
    .fields({ node: true, size: true })
    .exec((res: any) => {
      const item = res && res[0]
      if (!item || !item.node) return
      const node = item.node as HTMLCanvasElement
      const dpr = uni.getSystemInfoSync().pixelRatio || 2
      node.width = item.width * dpr
      node.height = item.height * dpr
      const c = node.getContext('2d') as CanvasRenderingContext2D
      if (!c) return
      c.scale((item.width * dpr) / VIEW_W, (item.height * dpr) / VIEW_H)
      ctx.value = c
      draw()
    })
  // #endif

  // #ifndef MP-WEIXIN
  nextTick(() => {
    const host = document.getElementById(canvasId) as HTMLElement | null
    if (!host) return
    // uni-app H5 会把 id 挂在外层 uni-canvas 上，需要再取内部 canvas
    const el = (host.tagName.toLowerCase() === 'canvas'
      ? host
      : host.querySelector('canvas')) as HTMLCanvasElement | null
    if (!el) return
    const dpr = window.devicePixelRatio || 1
    const rect = (el.parentElement || el).getBoundingClientRect()
    el.width = Math.max(rect.width, 1) * dpr
    el.height = Math.max(rect.height, 1) * dpr
    const c = el.getContext('2d')
    if (!c) return
    c.scale(el.width / VIEW_W, el.height / VIEW_H)
    ctx.value = c
    draw()
  })
  // #endif
}

onMounted(init)
watch(() => props.values, () => draw(), { deep: true })
</script>

<template>
  <canvas :id="canvasId" type="2d" class="tj-line" :style="{ height }" />
</template>

<style scoped>
.tj-line {
  width: 100%;
  display: block;
}
</style>
