<template>
  <div class="system-page" v-loading="loading">
    <div class="card">
      <h3 class="card-title">基本设置</h3>
      <p class="card-sub">展示在小程序与后台的基础信息</p>
      <div class="form-row">
        <span class="form-label">站点名称</span>
        <el-input v-model="form.siteName" placeholder="例如：途记旅行日记" class="form-input" />
      </div>
      <div class="form-row">
        <span class="form-label">联系邮箱</span>
        <el-input v-model="form.contactEmail" placeholder="support@example.com" class="form-input" />
      </div>
      <div class="form-row">
        <span class="form-label">客服电话</span>
        <el-input v-model="form.servicePhone" placeholder="400-000-0000" class="form-input" />
      </div>
    </div>

    <div class="card">
      <h3 class="card-title">审核设置</h3>
      <p class="card-sub">控制用户发布内容是否需要人工审核</p>
      <div class="switch-row">
        <div class="switch-info">
          <span class="switch-title">游记发布前需审核</span>
          <span class="switch-desc">开启后游记进入待审核状态，通过后才对外展示</span>
        </div>
        <el-switch v-model="form.auditJournal" />
      </div>
      <div class="switch-row">
        <div class="switch-info">
          <span class="switch-title">游记图片需审核</span>
          <span class="switch-desc">上传的图片先审核再展示</span>
        </div>
        <el-switch v-model="form.auditImage" />
      </div>
      <div class="switch-row">
        <div class="switch-info">
          <span class="switch-title">新用户注册需审核</span>
          <span class="switch-desc">开启后新用户默认处于待审核状态</span>
        </div>
        <el-switch v-model="form.auditUser" />
      </div>
    </div>

    <div class="actions">
      <el-button type="primary" :loading="saving" :disabled="!auth.canWrite" @click="onSave">
        保存设置
      </el-button>
      <el-button @click="load">重置</el-button>
      <span v-if="!auth.canWrite" class="readonly-tip">当前角色为只读，无法修改设置</span>
    </div>

    <!-- 管理员账号（仅超级管理员可见） -->
    <div v-if="auth.isSuper" class="card">
      <div class="card-head">
        <div>
          <h3 class="card-title">管理员账号</h3>
          <p class="card-sub">后台登录账号与角色权限</p>
        </div>
        <el-button size="small" type="primary" @click="openCreate">新增管理员</el-button>
      </div>

      <el-table :data="accounts" size="small" empty-text="暂无账号">
        <el-table-column label="账号" prop="account" min-width="130" />
        <el-table-column label="姓名" prop="name" min-width="110" />
        <el-table-column label="角色" width="120">
          <template #default="{ row }">
            <span class="status-tag" :class="roleClass(row.role)">{{ row.roleText }}</span>
          </template>
        </el-table-column>
        <el-table-column label="最近登录" min-width="150">
          <template #default="{ row }">{{ formatTime(row.lastLoginAt) }}</template>
        </el-table-column>
        <el-table-column label="状态" width="90">
          <template #default="{ row }">
            <span class="status-tag" :class="row.status === 'normal' ? 'tag-green' : 'tag-gray'">
              {{ row.statusText }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150">
          <template #default="{ row }">
            <span class="link-btn" @click="openReset(row)">改密</span>
            <span
              class="link-btn"
              :class="{ danger: row.status === 'normal' }"
              @click="toggleAccount(row)"
            >
              {{ row.status === 'normal' ? '禁用' : '启用' }}
            </span>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 新增管理员 -->
    <el-dialog v-model="createVisible" title="新增管理员" width="420px">
      <el-form :model="createForm" label-width="80px">
        <el-form-item label="账号">
          <el-input v-model="createForm.account" placeholder="登录账号" />
        </el-form-item>
        <el-form-item label="姓名">
          <el-input v-model="createForm.name" placeholder="显示名称" />
        </el-form-item>
        <el-form-item label="密码">
          <el-input v-model="createForm.password" type="password" placeholder="至少 6 位" show-password />
        </el-form-item>
        <el-form-item label="角色">
          <el-select v-model="createForm.role" style="width: 100%">
            <el-option label="管理员" value="admin" />
            <el-option label="审核员" value="reviewer" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="createVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="submitCreate">确定</el-button>
      </template>
    </el-dialog>

    <!-- 重置密码 -->
    <el-dialog v-model="resetVisible" title="重置密码" width="380px">
      <p class="dialog-tip">为账号「{{ resetTarget?.account }}」设置新密码</p>
      <el-input v-model="newPassword" type="password" placeholder="至少 6 位" show-password />
      <template #footer>
        <el-button @click="resetVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="submitReset">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { systemApi } from '@/api'
import type { AdminAccountRow, SystemConfigs } from '@/api'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()

const loading = ref(false)
const saving = ref(false)
const submitting = ref(false)

const form = reactive<SystemConfigs>({
  siteName: '',
  contactEmail: '',
  servicePhone: '',
  auditJournal: true,
  auditImage: false,
  auditUser: false
})

const accounts = ref<AdminAccountRow[]>([])

const createVisible = ref(false)
const createForm = reactive({ account: '', name: '', password: '', role: 'admin' })
const resetVisible = ref(false)
const resetTarget = ref<AdminAccountRow | null>(null)
const newPassword = ref('')

function formatTime(v?: string | null) {
  if (!v) return '—'
  const d = new Date(v)
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`
}

function roleClass(role: string) {
  return role === 'super' ? 'tag-green' : role === 'admin' ? 'tag-blue' : 'tag-orange'
}

async function load() {
  loading.value = true
  try {
    const cfg = await systemApi.getConfigs()
    Object.assign(form, cfg)
    if (auth.isSuper) {
      accounts.value = await systemApi.accounts()
    }
  } finally {
    loading.value = false
  }
}

async function onSave() {
  if (!form.siteName.trim()) {
    ElMessage.warning('请填写站点名称')
    return
  }
  saving.value = true
  try {
    const cfg = await systemApi.saveConfigs({ ...form })
    Object.assign(form, cfg)
    ElMessage.success('设置已保存')
  } finally {
    saving.value = false
  }
}

function openCreate() {
  createForm.account = ''
  createForm.name = ''
  createForm.password = ''
  createForm.role = 'admin'
  createVisible.value = true
}

async function submitCreate() {
  if (!createForm.account.trim() || !createForm.name.trim()) {
    ElMessage.warning('请填写账号与姓名')
    return
  }
  if (createForm.password.length < 6) {
    ElMessage.warning('密码至少 6 位')
    return
  }
  submitting.value = true
  try {
    await systemApi.createAccount({ ...createForm })
    ElMessage.success('已新增管理员')
    createVisible.value = false
    accounts.value = await systemApi.accounts()
  } finally {
    submitting.value = false
  }
}

function openReset(row: AdminAccountRow) {
  resetTarget.value = row
  newPassword.value = ''
  resetVisible.value = true
}

async function submitReset() {
  if (!resetTarget.value) return
  if (newPassword.value.length < 6) {
    ElMessage.warning('密码至少 6 位')
    return
  }
  submitting.value = true
  try {
    await systemApi.resetPassword(resetTarget.value.id, newPassword.value)
    ElMessage.success('密码已重置')
    resetVisible.value = false
  } finally {
    submitting.value = false
  }
}

async function toggleAccount(row: AdminAccountRow) {
  const next = row.status === 'normal' ? 'disabled' : 'normal'
  const label = next === 'disabled' ? '禁用' : '启用'
  try {
    await ElMessageBox.confirm(`确定要${label}管理员「${row.name}」吗？`, `${label}账号`, {
      type: 'warning',
      confirmButtonText: '确定',
      cancelButtonText: '取消'
    })
  } catch {
    return
  }
  await systemApi.updateAccountStatus(row.id, next)
  ElMessage.success(`已${label}`)
  accounts.value = await systemApi.accounts()
}

onMounted(load)
</script>

<style scoped>
.system-page {
  display: flex;
  flex-direction: column;
  gap: 20px;
  max-width: 860px;
}
.card {
  background: #fff;
  border-radius: 12px;
  padding: 24px;
}
.card-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
}
.card-title {
  font-size: 16px;
  font-weight: 700;
  margin: 0;
}
.card-sub {
  font-size: 13px;
  color: #999;
  margin: 4px 0 20px;
}
.form-row {
  display: flex;
  align-items: center;
  margin-bottom: 16px;
  gap: 12px;
}
.form-label {
  width: 90px;
  flex-shrink: 0;
  font-size: 14px;
  color: #555;
}
.form-input {
  flex: 1;
}
.switch-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 0;
  border-bottom: 1px solid #f0f0f0;
}
.switch-row:last-child {
  border-bottom: none;
}
.switch-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.switch-title {
  font-size: 14px;
  font-weight: 600;
}
.switch-desc {
  font-size: 12px;
  color: #999;
}
.actions {
  display: flex;
  align-items: center;
  gap: 12px;
}
.readonly-tip {
  font-size: 12px;
  color: #b0b8b2;
}
.dialog-tip {
  font-size: 13px;
  color: #666;
  margin-bottom: 12px;
}
</style>
