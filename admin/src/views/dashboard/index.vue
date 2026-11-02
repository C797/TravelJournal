<template>
  <div class="dashboard" v-loading="loading">
    <!-- 数据统计卡片 -->
    <div class="stat-grid">
      <div v-for="s in statCards" :key="s.key" class="stat-card">
        <div class="stat-label">{{ s.label }}</div>
        <div class="stat-value">{{ s.value }}<span class="stat-unit">{{ s.unit }}</span></div>
        <div class="stat-ratio">
          <template v-if="s.ratio === null">
            <span class="stat-muted">环比 —</span>
          </template>
          <template v-else>
            <span :class="s.ratio >= 0 ? 'up' : 'down'">
              {{ s.ratio >= 0 ? '↑' : '↓' }} {{ Math.abs(s.ratio).toFixed(1) }}%
            </span>
            <span class="stat-muted">较上月</span>
          </template>
        </div>
      </div>
    </div>

    <!-- 待审核提示 -->
    <div v-if="pendingJournals > 0" class="notice" @click="goJournals">
      <span class="notice-dot" />
      <span>有 <b>{{ pendingJournals }}</b> 篇游记待审核，点击去处理</span>
      <span class="notice-arrow">→</span>
    </div>

    <div class="row">
      <!-- 数据趋势 -->
      <div class="trend-card card">
        <div class="card-header">
          <span class="card-title">数据趋势</span>
          <div class="legend">
            <span class="legend-item"><i class="dot dot-green" />新增用户</span>
            <span class="legend-item"><i class="dot dot-orange" />新增游记</span>
          </div>
        </div>
        <svg viewBox="0 0 500 220" class="trend-svg" preserveAspectRatio="none">
          <line v-for="i in 4" :key="i" x1="0" :y1="(i - 1) * 60" x2="500" :y2="(i - 1) * 60" stroke="#f2f4f2" />
          <polyline :points="userLine" fill="none" stroke="#2e9e6b" stroke-width="2" vector-effect="non-scaling-stroke" />
          <polyline :points="journalLine" fill="none" stroke="#c77b4a" stroke-width="2" vector-effect="non-scaling-stroke" />
        </svg>
        <div class="trend-xaxis">
          <span v-for="d in dates" :key="d">{{ d }}</span>
        </div>
      </div>

      <!-- 内容构成 -->
      <div class="compose-card card">
        <div class="card-header">
          <span class="card-title">内容构成</span>
          <span class="card-muted">累计占比</span>
        </div>
        <div v-for="c in composeData" :key="c.name" class="compose-item">
          <div class="compose-label">
            <span>{{ c.name }}<i class="compose-count">{{ c.count }}</i></span>
            <span>{{ c.value }}%</span>
          </div>
          <div class="compose-track">
            <div class="compose-fill" :style="{ width: c.value + '%', background: c.color }" />
          </div>
        </div>
      </div>
    </div>

    <!-- 最近注册用户 -->
    <div class="users-card card">
      <div class="card-header">
        <span class="card-title">最近注册用户</span>
        <span class="view-all" @click="goUsers">查看全部</span>
      </div>
      <el-table :data="recentUsers" style="width: 100%" empty-text="暂无用户">
        <el-table-column label="用户" min-width="160">
          <template #default="{ row }">
            <div class="user-cell">
              <img v-if="row.avatar" :src="row.avatar" class="user-avatar" />
              <span v-else class="user-avatar fallback">{{ row.initial }}</span>
              <span class="user-name">{{ row.nickname }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="手机号" min-width="130">
          <template #default="{ row }">{{ row.phone || '—' }}</template>
        </el-table-column>
        <el-table-column label="旅行册" width="100">
          <template #default="{ row }">{{ row.books }} 本</template>
        </el-table-column>
        <el-table-column label="注册时间" min-width="160">
          <template #default="{ row }">{{ formatTime(row.createdAt) }}</template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <span class="status-tag" :class="row.status === 'normal' ? 'tag-green' : 'tag-gray'">
              {{ row.statusText }}
            </span>
          </template>
        </el-table-column>
      </el-table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { dashboardApi } from '@/api'
import type { DashboardSummary } from '@/api'

const router = useRouter()
const loading = ref(false)
const data = ref<DashboardSummary | null>(null)

const statCards = computed(() =>
  (data.value?.cards || []).map((c) => ({
    key: c.key,
    label: c.label,
    value: c.value.toLocaleString('zh-CN'),
    unit: c.unit,
    ratio: c.ratio
  }))
)

const pendingJournals = computed(() => data.value?.pendingJournals || 0)
const composeData = computed(() => data.value?.composition || [])
const recentUsers = computed(() => data.value?.recentUsers || [])

const trendList = computed(() => data.value?.trend || [])
const dates = computed(() => trendList.value.map((d) => d.label))

/** 把数值序列映射成 viewBox(500×220) 内的折线点串 */
function toPoints(values: number[]) {
  if (!values.length) return ''
  const max = Math.max(...values, 1)
  const stepX = values.length > 1 ? 500 / (values.length - 1) : 0
  return values
    .map((v, i) => `${Math.round(i * stepX)},${Math.round(180 - (v / max) * 150 + 20)}`)
    .join(' ')
}

const userLine = computed(() => toPoints(trendList.value.map((d) => d.users)))
const journalLine = computed(() => toPoints(trendList.value.map((d) => d.journals)))

function formatTime(v: string) {
  if (!v) return '—'
  const d = new Date(v)
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`
}

function goUsers() {
  router.push('/users')
}
function goJournals() {
  router.push('/journals')
}

async function load() {
  loading.value = true
  try {
    data.value = await dashboardApi.summary()
  } finally {
    loading.value = false
  }
}

onMounted(load)
</script>

<style scoped>
.dashboard {
  display: flex;
  flex-direction: column;
  gap: 20px;
}
.stat-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
}
.stat-card {
  background: #fff;
  border-radius: 12px;
  padding: 20px;
}
.stat-label {
  font-size: 13px;
  color: #999;
}
.stat-value {
  font-size: 26px;
  font-weight: 700;
  margin: 8px 0;
}
.stat-unit {
  font-size: 13px;
  font-weight: 400;
  color: #999;
  margin-left: 4px;
}
.stat-ratio {
  font-size: 13px;
  color: #2e9e6b;
  display: flex;
  gap: 4px;
  align-items: center;
}
.stat-ratio .down {
  color: #c0563f;
}
.stat-ratio .up {
  color: #2e9e6b;
}
.stat-muted {
  color: #999;
}
.notice {
  display: flex;
  align-items: center;
  gap: 10px;
  background: #fff8ee;
  border: 1px solid #f2e2c9;
  border-radius: 10px;
  padding: 12px 18px;
  font-size: 13px;
  color: #8a6532;
  cursor: pointer;
}
.notice b {
  color: #c77b4a;
}
.notice-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #c77b4a;
}
.notice-arrow {
  margin-left: auto;
  color: #c0a882;
}
.row {
  display: flex;
  gap: 20px;
}
.trend-card {
  flex: 2;
  min-width: 0;
}
.compose-card {
  flex: 1;
  min-width: 0;
}
.card {
  background: #fff;
  border-radius: 12px;
  padding: 20px;
}
.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}
.card-title {
  font-size: 15px;
  font-weight: 700;
}
.card-muted {
  font-size: 12px;
  color: #999;
}
.legend {
  display: flex;
  gap: 16px;
}
.legend-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #666;
}
.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}
.dot-green {
  background: #2e9e6b;
}
.dot-orange {
  background: #c77b4a;
}
.trend-svg {
  width: 100%;
  height: 220px;
  display: block;
}
.trend-xaxis {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: #999;
  margin-top: 8px;
}
.compose-item {
  margin-bottom: 16px;
}
.compose-label {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
  margin-bottom: 6px;
}
.compose-count {
  font-style: normal;
  color: #b0b8b2;
  margin-left: 6px;
  font-size: 12px;
}
.compose-track {
  height: 8px;
  background: #f0f0f0;
  border-radius: 4px;
}
.compose-fill {
  height: 100%;
  border-radius: 4px;
  transition: width 0.3s;
}
.users-card {
  background: #fff;
  border-radius: 12px;
  padding: 20px;
}
.view-all {
  font-size: 13px;
  color: #2e9e6b;
  cursor: pointer;
}
.status-tag {
  padding: 2px 10px;
  border-radius: 10px;
  font-size: 12px;
}
.tag-green {
  background: #dcfce7;
  color: #16a34a;
}
.tag-gray {
  background: #f0f0f0;
  color: #999;
}
.user-cell {
  display: flex;
  align-items: center;
  gap: 10px;
}
.user-avatar {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0;
}
.user-avatar.fallback {
  display: flex;
  align-items: center;
  justify-content: center;
  background: #eaf3ec;
  color: #2e9e6b;
  font-size: 12px;
  font-weight: 600;
}
.user-name {
  font-size: 13px;
  color: #1a1a1a;
}
</style>
