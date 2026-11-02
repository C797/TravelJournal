<template>
  <div class="manage-page">
    <!-- 工具栏 -->
    <div class="manage-toolbar">
      <el-input
        v-model="keyword"
        class="manage-search"
        placeholder="搜索昵称 / 手机号 / 用户编号"
        clearable
        @keyup.enter="search"
        @clear="search"
      >
        <template #prefix>
          <span class="search-icon">⌕</span>
        </template>
      </el-input>

      <el-select v-model="status" class="manage-select" placeholder="全部状态" @change="search">
        <el-option label="全部状态" value="all" />
        <el-option label="正常" value="normal" />
        <el-option label="已禁用" value="disabled" />
      </el-select>

      <el-button @click="search">查询</el-button>
      <el-button text @click="reset">重置</el-button>

      <div class="toolbar-right">
        <span class="manage-sub">共 {{ total.toLocaleString('zh-CN') }} 位用户</span>
      </div>
    </div>

    <!-- 表格 -->
    <div class="manage-card">
      <el-table :data="list" v-loading="loading" style="width: 100%" empty-text="暂无用户数据">
        <el-table-column label="用户" min-width="200">
          <template #default="{ row }">
            <div class="cell-user">
              <img v-if="row.avatar" :src="row.avatar" class="cell-avatar" />
              <span v-else class="cell-avatar initial">{{ row.initial }}</span>
              <div>
                <div class="cell-name">{{ row.nickname }}</div>
                <div v-if="row.userIdCode" class="cell-sub">ID {{ row.userIdCode }}</div>
              </div>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="手机号" min-width="130">
          <template #default="{ row }">
            <span :class="{ 'cell-muted': !row.phone }">{{ row.phone || '未绑定' }}</span>
          </template>
        </el-table-column>

        <el-table-column label="旅行册" width="100">
          <template #default="{ row }">{{ row.books }} 本</template>
        </el-table-column>

        <el-table-column label="游记" width="100">
          <template #default="{ row }">{{ row.journals }} 篇</template>
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

        <el-table-column label="操作" width="170" fixed="right">
          <template #default="{ row }">
            <span class="link-btn" @click="openDetail(row)">查看</span>
            <span
              v-if="auth.canWrite"
              class="link-btn"
              :class="{ danger: row.status === 'normal' }"
              @click="toggleStatus(row)"
            >
              {{ row.status === 'normal' ? '禁用' : '启用' }}
            </span>
            <span v-if="auth.isSuper" class="link-btn danger" @click="remove(row)">删除</span>
          </template>
        </el-table-column>
      </el-table>

      <div class="manage-footer">
        <span class="manage-total">第 {{ page }} / {{ totalPages }} 页</span>
        <el-pagination
          v-model:current-page="page"
          :page-size="pageSize"
          :total="total"
          layout="prev, pager, next, jumper"
          background
          @current-change="load"
        />
      </div>
    </div>

    <!-- 用户详情 -->
    <el-drawer v-model="detailVisible" title="用户详情" size="420px">
      <div v-if="detail" class="detail">
        <div class="detail-head">
          <img v-if="detail.avatar" :src="detail.avatar" class="detail-avatar" />
          <span v-else class="detail-avatar initial">{{ (detail.nickname || '游').slice(0, 1) }}</span>
          <div>
            <div class="detail-name">{{ detail.nickname }}</div>
            <div class="cell-sub">{{ detail.userIdCode || '—' }}</div>
          </div>
        </div>

        <el-descriptions :column="1" border size="small" class="detail-desc">
          <el-descriptions-item label="手机号">{{ detail.phone || '未绑定' }}</el-descriptions-item>
          <el-descriptions-item label="状态">{{ detail.statusText }}</el-descriptions-item>
          <el-descriptions-item label="注册时间">{{ formatTime(detail.createdAt) }}</el-descriptions-item>
        </el-descriptions>

        <div class="detail-stats">
          <div class="ds-item">
            <div class="ds-num">{{ detail.stats?.travelBooks ?? 0 }}</div>
            <div class="ds-label">旅行册</div>
          </div>
          <div class="ds-item">
            <div class="ds-num">{{ detail.stats?.journals ?? 0 }}</div>
            <div class="ds-label">游记</div>
          </div>
          <div class="ds-item">
            <div class="ds-num">{{ detail.stats?.bills ?? 0 }}</div>
            <div class="ds-label">账单</div>
          </div>
          <div class="ds-item">
            <div class="ds-num">¥{{ (detail.stats?.totalExpense || 0).toLocaleString('zh-CN') }}</div>
            <div class="ds-label">累计支出</div>
          </div>
        </div>

        <div class="detail-section">最近游记</div>
        <div v-if="detail.recentJournals?.length" class="detail-journals">
          <div v-for="j in detail.recentJournals" :key="j.id" class="dj-item">
            <div class="dj-title">{{ j.title }}</div>
            <div class="cell-sub">{{ formatDate(j.travelDate || j.createdAt) }}</div>
          </div>
        </div>
        <div v-else class="manage-empty">暂无游记</div>
      </div>
    </el-drawer>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { userApi } from '@/api'
import type { UserRow } from '@/api'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const route = useRoute()

const list = ref<UserRow[]>([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(20)
const totalPages = ref(1)
const keyword = ref((route.query.keyword as string) || '')
const status = ref('all')
const loading = ref(false)

const detailVisible = ref(false)
const detail = ref<any>(null)

function formatTime(v?: string | null) {
  if (!v) return '—'
  const d = new Date(v)
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`
}

function formatDate(v?: string | null) {
  if (!v) return '—'
  return String(v).slice(0, 10)
}

async function load() {
  loading.value = true
  try {
    const res = await userApi.list({
      page: page.value,
      pageSize: pageSize.value,
      keyword: keyword.value.trim() || undefined,
      status: status.value
    })
    list.value = res.list
    total.value = res.total
    totalPages.value = res.totalPages
  } catch {
    list.value = []
  } finally {
    loading.value = false
  }
}

function search() {
  page.value = 1
  load()
}

function reset() {
  keyword.value = ''
  status.value = 'all'
  page.value = 1
  load()
}

async function openDetail(row: UserRow) {
  detailVisible.value = true
  detail.value = null
  try {
    detail.value = await userApi.detail(row.id)
  } catch {
    detailVisible.value = false
  }
}

async function toggleStatus(row: UserRow) {
  const next = row.status === 'normal' ? 'disabled' : 'normal'
  const label = next === 'disabled' ? '禁用' : '启用'
  try {
    await ElMessageBox.confirm(
      `确定要${label}用户「${row.nickname}」吗？${next === 'disabled' ? '禁用后该用户将无法登录小程序。' : ''}`,
      `${label}用户`,
      { type: 'warning', confirmButtonText: '确定', cancelButtonText: '取消' }
    )
  } catch {
    return
  }
  await userApi.updateStatus(row.id, next)
  ElMessage.success(`已${label}`)
  load()
}

async function remove(row: UserRow) {
  try {
    await ElMessageBox.confirm(
      `删除用户「${row.nickname}」会同时删除其旅行册、游记与账单，且不可恢复。确定继续吗？`,
      '删除用户',
      { type: 'error', confirmButtonText: '确认删除', cancelButtonText: '取消' }
    )
  } catch {
    return
  }
  await userApi.remove(row.id)
  ElMessage.success('已删除')
  if (list.value.length === 1 && page.value > 1) page.value -= 1
  load()
}

onMounted(load)

// 顶部搜索框跳转过来时，同步关键词并重新查询
watch(
  () => route.query.keyword,
  (v) => {
    if (typeof v === 'string' && v !== keyword.value) {
      keyword.value = v
      search()
    }
  }
)
</script>

<style scoped>
.search-icon {
  font-size: 15px;
  color: #b0b8b2;
}
.detail {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.detail-head {
  display: flex;
  align-items: center;
  gap: 14px;
}
.detail-avatar {
  width: 52px;
  height: 52px;
  border-radius: 50%;
  object-fit: cover;
  background: #eaf3ec;
}
.detail-avatar.initial {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  font-weight: 700;
  color: #2e9e6b;
}
.detail-name {
  font-size: 16px;
  font-weight: 700;
  color: #1a1a1a;
}
.detail-stats {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
}
.ds-item {
  background: #f7f9f7;
  border-radius: 10px;
  padding: 12px 14px;
}
.ds-num {
  font-size: 18px;
  font-weight: 700;
  color: #1a2e2a;
}
.ds-label {
  font-size: 12px;
  color: #9aa39d;
  margin-top: 2px;
}
.detail-section {
  font-size: 13px;
  font-weight: 700;
  color: #1a1a1a;
  margin-top: 4px;
}
.detail-journals {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.dj-item {
  background: #f7f9f7;
  border-radius: 8px;
  padding: 10px 12px;
}
.dj-title {
  font-size: 13px;
  color: #1a2e2a;
  font-weight: 600;
}
</style>
