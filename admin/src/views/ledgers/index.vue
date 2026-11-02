<template>
  <div class="manage-page">
    <div class="manage-toolbar">
      <el-input
        v-model="keyword"
        class="manage-search"
        placeholder="搜索账本名称 / 旅行册"
        clearable
        @keyup.enter="search"
        @clear="search"
      />
      <el-select v-model="status" class="manage-select" placeholder="全部状态" @change="search">
        <el-option label="全部状态" value="all" />
        <el-option label="正常" value="normal" />
        <el-option label="已停用" value="disabled" />
      </el-select>
      <el-button @click="search">查询</el-button>
      <el-button text @click="reset">重置</el-button>
      <div class="toolbar-right">
        <span class="manage-sub">共 {{ total.toLocaleString('zh-CN') }} 个账本</span>
      </div>
    </div>

    <div class="manage-card">
      <el-table :data="list" v-loading="loading" style="width: 100%" empty-text="暂无账本">
        <el-table-column label="账本名称" min-width="180">
          <template #default="{ row }">
            <div class="cell-name">{{ row.name }}</div>
            <div class="cell-sub">{{ row.book }}</div>
          </template>
        </el-table-column>

        <el-table-column label="成员" width="90">
          <template #default="{ row }">{{ row.members }} 人</template>
        </el-table-column>

        <el-table-column label="账单数" width="100">
          <template #default="{ row }">{{ row.bills }} 笔</template>
        </el-table-column>

        <el-table-column label="累计支出" min-width="130">
          <template #default="{ row }">
            <span class="cell-money">¥{{ row.totalExpense.toLocaleString('zh-CN') }}</span>
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
              {{ row.status === 'normal' ? '停用' : '启用' }}
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
import { ledgerApi } from '@/api'
import type { LedgerRow } from '@/api'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()

const list = ref<LedgerRow[]>([])
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
    const res = await ledgerApi.list({
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

async function toggleStatus(row: LedgerRow) {
  const next = row.status === 'normal' ? 'disabled' : 'normal'
  const label = next === 'disabled' ? '停用' : '启用'
  try {
    await ElMessageBox.confirm(`确定要${label}账本「${row.name}」吗？`, `${label}账本`, {
      type: 'warning',
      confirmButtonText: '确定',
      cancelButtonText: '取消'
    })
  } catch {
    return
  }
  await ledgerApi.updateStatus(row.id, next)
  ElMessage.success(`已${label}`)
  load()
}

async function remove(row: LedgerRow) {
  try {
    await ElMessageBox.confirm(
      `删除账本「${row.name}」会同时删除其 ${row.bills} 笔账单，且不可恢复。确定继续吗？`,
      '删除账本',
      { type: 'error', confirmButtonText: '确认删除', cancelButtonText: '取消' }
    )
  } catch {
    return
  }
  await ledgerApi.remove(row.id)
  ElMessage.success('已删除')
  if (list.value.length === 1 && page.value > 1) page.value -= 1
  load()
}

onMounted(load)
</script>
