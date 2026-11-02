<template>
  <div class="manage-page">
    <div class="manage-toolbar">
      <el-input
        v-model="keyword"
        class="manage-search"
        placeholder="搜索操作内容 / 操作人 / IP"
        clearable
        @keyup.enter="search"
        @clear="search"
      />
      <el-select v-model="module" class="manage-select" placeholder="全部模块" @change="search">
        <el-option label="全部模块" value="all" />
        <el-option label="用户" value="user" />
        <el-option label="旅行册" value="travelBook" />
        <el-option label="游记" value="journal" />
        <el-option label="账本" value="ledger" />
        <el-option label="系统" value="system" />
        <el-option label="登录" value="auth" />
      </el-select>
      <el-date-picker
        v-model="dateRange"
        type="daterange"
        range-separator="至"
        start-placeholder="开始日期"
        end-placeholder="结束日期"
        value-format="YYYY-MM-DD"
        style="width: 260px"
        @change="search"
      />
      <el-button @click="search">查询</el-button>
      <el-button text @click="reset">重置</el-button>
      <div class="toolbar-right">
        <span class="manage-sub">共 {{ total.toLocaleString('zh-CN') }} 条日志</span>
      </div>
    </div>

    <div class="manage-card">
      <el-table :data="list" v-loading="loading" style="width: 100%" empty-text="暂无操作日志">
        <el-table-column label="时间" min-width="150">
          <template #default="{ row }">{{ formatTime(row.createdAt) }}</template>
        </el-table-column>

        <el-table-column label="操作人" min-width="110">
          <template #default="{ row }">{{ row.adminName || '系统' }}</template>
        </el-table-column>

        <el-table-column label="模块" width="100">
          <template #default="{ row }">
            <span class="status-tag" :class="moduleClass(row.module)">
              {{ moduleText(row.module) }}
            </span>
          </template>
        </el-table-column>

        <el-table-column label="操作内容" min-width="280">
          <template #default="{ row }">{{ row.content }}</template>
        </el-table-column>

        <el-table-column label="IP 地址" min-width="130">
          <template #default="{ row }">
            <span class="cell-muted">{{ row.ip || '—' }}</span>
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
import { systemApi } from '@/api'
import type { LogRow } from '@/api'

const list = ref<LogRow[]>([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(20)
const totalPages = ref(1)
const keyword = ref('')
const module = ref('all')
const dateRange = ref<[string, string] | null>(null)
const loading = ref(false)

const MODULE_TEXT: Record<string, string> = {
  user: '用户',
  travelBook: '旅行册',
  journal: '游记',
  ledger: '账本',
  system: '系统',
  auth: '登录'
}

function moduleText(m: string) {
  return MODULE_TEXT[m] || m || '—'
}

function moduleClass(m: string) {
  if (m === 'auth') return 'tag-blue'
  if (m === 'system') return 'tag-orange'
  return 'tag-gray'
}

function formatTime(v?: string | null) {
  if (!v) return '—'
  const d = new Date(v)
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`
}

async function load() {
  loading.value = true
  try {
    const res = await systemApi.logs({
      page: page.value,
      pageSize: pageSize.value,
      keyword: keyword.value.trim() || undefined,
      module: module.value,
      startDate: dateRange.value?.[0],
      endDate: dateRange.value?.[1]
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
  module.value = 'all'
  dateRange.value = null
  page.value = 1
  load()
}

onMounted(load)
</script>
