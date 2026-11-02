<template>
  <div class="manage-page">
    <div class="manage-toolbar">
      <el-input
        v-model="keyword"
        class="manage-search"
        placeholder="搜索游记标题 / 作者"
        clearable
        @keyup.enter="search"
        @clear="search"
      />
      <el-select v-model="auditStatus" class="manage-select" placeholder="全部状态" @change="search">
        <el-option label="全部状态" value="all" />
        <el-option label="待审核" value="pending" />
        <el-option label="已通过" value="pass" />
        <el-option label="已驳回" value="reject" />
      </el-select>
      <el-button @click="search">查询</el-button>
      <el-button text @click="reset">重置</el-button>
      <div class="toolbar-right">
        <span class="manage-sub">共 {{ total.toLocaleString('zh-CN') }} 篇游记</span>
      </div>
    </div>

    <div class="manage-card">
      <el-table :data="list" v-loading="loading" style="width: 100%" empty-text="暂无游记">
        <el-table-column label="游记标题" min-width="220">
          <template #default="{ row }">
            <div class="cell-name">{{ row.title }}</div>
            <div class="cell-sub">{{ row.words.toLocaleString('zh-CN') }} 字 · {{ row.imageCount }} 张图</div>
          </template>
        </el-table-column>

        <el-table-column label="作者" min-width="110">
          <template #default="{ row }">{{ row.author }}</template>
        </el-table-column>

        <el-table-column label="所属旅行册" min-width="130">
          <template #default="{ row }">{{ row.book }}</template>
        </el-table-column>

        <el-table-column label="出行日期" min-width="110">
          <template #default="{ row }">{{ formatDate(row.travelDate) }}</template>
        </el-table-column>

        <el-table-column label="发布时间" min-width="140">
          <template #default="{ row }">{{ formatTime(row.createdAt) }}</template>
        </el-table-column>

        <el-table-column label="审核状态" width="110">
          <template #default="{ row }">
            <span class="status-tag" :class="auditClass(row.auditStatus)">{{ row.statusText }}</span>
          </template>
        </el-table-column>

        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <span class="link-btn" @click="openDetail(row)">查看</span>
            <template v-if="auth.canWrite">
              <span
                v-if="row.auditStatus !== 'pass'"
                class="link-btn"
                @click="audit(row, 'pass')"
              >
                通过
              </span>
              <span
                v-if="row.auditStatus !== 'reject'"
                class="link-btn danger"
                @click="audit(row, 'reject')"
              >
                驳回
              </span>
            </template>
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

    <!-- 游记详情 -->
    <el-drawer v-model="detailVisible" title="游记详情" size="480px">
      <div v-if="detail" class="detail">
        <h3 class="detail-title">{{ detail.title }}</h3>
        <div class="detail-meta">
          <span>{{ detail.user?.nickname || '—' }}</span>
          <span class="detail-dot">·</span>
          <span>{{ detail.travelBook?.name || '—' }}</span>
          <span class="detail-dot">·</span>
          <span>{{ formatDate(detail.travelDate) }}</span>
        </div>
        <div class="detail-tags">
          <span class="status-tag" :class="auditClass(detail.auditStatus)">
            {{ auditText(detail.auditStatus) }}
          </span>
          <span v-if="detail.weather" class="status-tag tag-blue">{{ detail.weather }}</span>
          <span v-if="detail.spot?.locationName" class="status-tag tag-gray">
            {{ detail.spot.province }} · {{ detail.spot.locationName }}
          </span>
          <span class="status-tag" :class="detail.isPublic ? 'tag-green' : 'tag-gray'">
            {{ detail.isPublic ? '公开' : '私密' }}
          </span>
        </div>
        <div v-if="detail.images?.length" class="detail-imgs">
          <img v-for="img in detail.images" :key="img.id" :src="img.url" class="detail-img" />
        </div>
        <div class="detail-content">{{ detail.content }}</div>
      </div>
      <div v-else class="manage-empty">加载中…</div>
    </el-drawer>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { journalApi } from '@/api'
import type { JournalRow } from '@/api'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()

const list = ref<JournalRow[]>([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(20)
const totalPages = ref(1)
const keyword = ref('')
const auditStatus = ref('all')
const loading = ref(false)

const detailVisible = ref(false)
const detail = ref<any>(null)

function formatDate(v?: string | null) {
  if (!v) return '—'
  return String(v).slice(0, 10)
}

function formatTime(v?: string | null) {
  if (!v) return '—'
  const d = new Date(v)
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`
}

function auditClass(s: string) {
  return s === 'pass' ? 'tag-green' : s === 'reject' ? 'tag-red' : 'tag-orange'
}

function auditText(s: string) {
  return s === 'pass' ? '已通过' : s === 'reject' ? '已驳回' : '待审核'
}

async function load() {
  loading.value = true
  try {
    const res = await journalApi.list({
      page: page.value,
      pageSize: pageSize.value,
      keyword: keyword.value.trim() || undefined,
      auditStatus: auditStatus.value
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
  auditStatus.value = 'all'
  page.value = 1
  load()
}

async function openDetail(row: JournalRow) {
  detailVisible.value = true
  detail.value = null
  try {
    detail.value = await journalApi.detail(row.id)
  } catch {
    detailVisible.value = false
  }
}

async function audit(row: JournalRow, next: 'pass' | 'reject') {
  const label = next === 'pass' ? '通过' : '驳回'
  try {
    await ElMessageBox.confirm(`确定要${label}游记「${row.title}」吗？`, `${label}审核`, {
      type: 'warning',
      confirmButtonText: '确定',
      cancelButtonText: '取消'
    })
  } catch {
    return
  }
  await journalApi.audit(row.id, next)
  ElMessage.success(`已${label}`)
  load()
}

async function remove(row: JournalRow) {
  try {
    await ElMessageBox.confirm(`删除游记「${row.title}」后不可恢复，确定继续吗？`, '删除游记', {
      type: 'error',
      confirmButtonText: '确认删除',
      cancelButtonText: '取消'
    })
  } catch {
    return
  }
  await journalApi.remove(row.id)
  ElMessage.success('已删除')
  if (list.value.length === 1 && page.value > 1) page.value -= 1
  load()
}

onMounted(load)
</script>

<style scoped>
.detail {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.detail-title {
  font-size: 18px;
  font-weight: 700;
  color: #1a1a1a;
  margin: 0;
}
.detail-meta {
  font-size: 12px;
  color: #9aa39d;
  display: flex;
  gap: 6px;
  align-items: center;
}
.detail-dot {
  color: #d0d6d2;
}
.detail-tags {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}
.detail-imgs {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 6px;
}
.detail-img {
  width: 100%;
  aspect-ratio: 1;
  object-fit: cover;
  border-radius: 6px;
}
.detail-content {
  font-size: 14px;
  line-height: 1.9;
  color: #4a5752;
  white-space: pre-wrap;
  word-break: break-word;
}
</style>
