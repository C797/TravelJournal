<template>
  <div class="manage-page">
    <div class="manage-toolbar">
      <el-input
        v-model="keyword"
        class="manage-search"
        placeholder="搜索旅行册名称 / 所有者"
        clearable
        @keyup.enter="search"
        @clear="search"
      />
      <el-select v-model="status" class="manage-select" placeholder="全部状态" @change="search">
        <el-option label="全部状态" value="all" />
        <el-option label="正常" value="normal" />
        <el-option label="已下架" value="offline" />
      </el-select>
      <el-button @click="search">查询</el-button>
      <el-button text @click="reset">重置</el-button>
      <div class="toolbar-right">
        <span class="manage-sub">共 {{ total.toLocaleString('zh-CN') }} 本旅行册</span>
      </div>
    </div>

    <div class="manage-card">
      <el-table :data="list" v-loading="loading" style="width: 100%" empty-text="暂无旅行册">
        <el-table-column label="旅行册" min-width="200">
          <template #default="{ row }">
            <div class="cell-user">
              <img v-if="row.coverUrl" :src="row.coverUrl" class="cell-cover" />
              <span v-else class="cell-cover initial">{{ row.name.slice(0, 1) }}</span>
              <div>
                <div class="cell-name">{{ row.name }}</div>
                <div class="cell-sub">
                  {{ row.startTime ? formatDate(row.startTime) : '—' }} ~
                  {{ row.endTime ? formatDate(row.endTime) : '—' }}
                </div>
              </div>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="所有者" min-width="120">
          <template #default="{ row }">{{ row.owner }}</template>
        </el-table-column>

        <el-table-column label="标注点" width="100">
          <template #default="{ row }">{{ row.spots }}</template>
        </el-table-column>

        <el-table-column label="游记" width="90">
          <template #default="{ row }">{{ row.journals }}</template>
        </el-table-column>

        <el-table-column label="成员" width="90">
          <template #default="{ row }">{{ row.members }}</template>
        </el-table-column>

        <el-table-column label="公开" width="90">
          <template #default="{ row }">
            <span class="status-tag" :class="row.bookIsPublic ? 'tag-blue' : 'tag-gray'">
              {{ row.bookIsPublic ? '公开' : '私密' }}
            </span>
          </template>
        </el-table-column>

        <el-table-column label="创建时间" min-width="120">
          <template #default="{ row }">{{ formatDate(row.createdAt) }}</template>
        </el-table-column>

        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <span class="status-tag" :class="row.status === 'normal' ? 'tag-green' : 'tag-gray'">
              {{ row.statusText }}
            </span>
          </template>
        </el-table-column>

        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <span
              v-if="auth.canWrite"
              class="link-btn"
              :class="{ danger: row.status === 'normal' }"
              @click="toggleStatus(row)"
            >
              {{ row.status === 'normal' ? '下架' : '恢复' }}
            </span>
            <span v-if="auth.canWrite" class="link-btn danger" @click="remove(row)">删除</span>
            <span v-if="!auth.canWrite" class="link-btn disabled">只读</span>
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
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { bookApi } from '@/api'
import type { BookRow } from '@/api'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()

const list = ref<BookRow[]>([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(20)
const totalPages = ref(1)
const keyword = ref('')
const status = ref('all')
const loading = ref(false)

function formatDate(v?: string | null) {
  if (!v) return '—'
  return String(v).slice(0, 10)
}

async function load() {
  loading.value = true
  try {
    const res = await bookApi.list({
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

async function toggleStatus(row: BookRow) {
  const next = row.status === 'normal' ? 'offline' : 'normal'
  const label = next === 'offline' ? '下架' : '恢复'
  try {
    await ElMessageBox.confirm(
      `确定要${label}旅行册「${row.name}」吗？${next === 'offline' ? '下架后小程序端将不再展示。' : ''}`,
      `${label}旅行册`,
      { type: 'warning', confirmButtonText: '确定', cancelButtonText: '取消' }
    )
  } catch {
    return
  }
  await bookApi.updateStatus(row.id, next)
  ElMessage.success(`已${label}`)
  load()
}

async function remove(row: BookRow) {
  try {
    await ElMessageBox.confirm(
      `删除旅行册「${row.name}」会同时删除其标注点、游记与账本，且不可恢复。确定继续吗？`,
      '删除旅行册',
      { type: 'error', confirmButtonText: '确认删除', cancelButtonText: '取消' }
    )
  } catch {
    return
  }
  await bookApi.remove(row.id)
  ElMessage.success('已删除')
  if (list.value.length === 1 && page.value > 1) page.value -= 1
  load()
}

onMounted(load)
</script>

<style scoped>
.cell-cover {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  object-fit: cover;
  flex-shrink: 0;
  background: #eaf3ec;
}
.cell-cover.initial {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 700;
  color: #2e9e6b;
}
</style>
