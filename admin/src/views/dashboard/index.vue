<template>
  <div class="dashboard">
    <!-- 数据统计卡片 -->
    <div class="stat-grid">
      <div v-for="s in statCards" :key="s.label" class="stat-card">
        <div class="stat-label">{{ s.label }}</div>
        <div class="stat-value">{{ s.value }}</div>
        <div class="stat-ratio">↑ {{ s.ratio }} <span class="stat-muted">较上月</span></div>
      </div>
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
        <svg viewBox="0 0 500 220" class="trend-svg">
          <polyline :points="userLine" fill="none" stroke="#2e9e6b" stroke-width="2" />
          <polyline :points="journalLine" fill="none" stroke="#c77b4a" stroke-width="2" />
        </svg>
        <div class="trend-xaxis">
          <span v-for="d in dates" :key="d">{{ d }}</span>
        </div>
      </div>

      <!-- 内容构成 -->
      <div class="compose-card card">
        <div class="card-header">
          <span class="card-title">内容构成</span>
          <span class="card-muted">近 30 天</span>
        </div>
        <div v-for="c in composeData" :key="c.name" class="compose-item">
          <div class="compose-label">
            <span>{{ c.name }}</span>
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
        <span class="view-all">查看全部</span>
      </div>
      <el-table :data="recentUsers" style="width: 100%">
        <el-table-column label="用户" prop="name" />
        <el-table-column label="手机号" prop="phone" />
        <el-table-column label="旅行册" prop="books" />
        <el-table-column label="注册时间" prop="time" />
        <el-table-column label="状态" prop="status">
          <template #default="{ row }">
            <span class="status-tag" :class="row.status === '正常' ? 'tag-green' : 'tag-gray'">{{ row.status }}</span>
          </template>
        </el-table-column>
        <el-table-column label="操作">
          <template #default>
            <span class="detail-link">详情</span>
          </template>
        </el-table-column>
      </el-table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const statCards = [
  { label: '用户总数', value: '12,486', ratio: '12.5%' },
  { label: '旅行册数', value: '3,892', ratio: '8.3%' },
  { label: '游记数', value: '28,654', ratio: '15.2%' },
  { label: '账单数', value: '96,320', ratio: '9.8%' }
]

const dates = ['10.26', '10.27', '10.28', '10.29', '10.30', '10.31', '11.01']

const userLine = ref('0,160 70,140 140,150 210,120 280,130 350,90 420,60 500,40')
const journalLine = ref('0,190 70,180 140,185 210,160 280,170 350,150 420,140 500,130')

const composeData = [
  { name: '旅行册', value: 42, color: '#2e9e6b' },
  { name: '游记', value: 25, color: '#c77b4a' },
  { name: '账单', value: 18, color: '#9db8a5' },
  { name: '其他', value: 15, color: '#dce5dd' }
]

const recentUsers = [
  { name: '旅行者小王', phone: '138****5678', books: '3 本', time: '2026-10-31 14:23', status: '正常' },
  { name: '周同学', phone: '139****1234', books: '2 本', time: '2026-10-30 09:12', status: '正常' },
  { name: '陈小姐', phone: '137****9999', books: '1 本', time: '2026-10-29 18:40', status: '正常' },
  { name: '李工', phone: '136****2211', books: '4 本', time: '2026-10-28 11:05', status: '禁用' }
]
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
.stat-ratio {
  font-size: 13px;
  color: #2e9e6b;
}
.stat-muted {
  color: #999;
}
.row {
  display: flex;
  gap: 20px;
}
.trend-card {
  flex: 2;
}
.compose-card {
  flex: 1;
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
.dot-green { background: #2e9e6b; }
.dot-orange { background: #c77b4a; }
.trend-svg {
  width: 100%;
  height: 220px;
}
.trend-xaxis {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: #999;
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
.compose-track {
  height: 8px;
  background: #f0f0f0;
  border-radius: 4px;
}
.compose-fill {
  height: 100%;
  border-radius: 4px;
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
.tag-green { background: #dcfce7; color: #16a34a; }
.tag-gray { background: #f0f0f0; color: #999; }
.detail-link {
  color: #2e9e6b;
  cursor: pointer;
}
</style>
