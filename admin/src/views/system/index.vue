<template>
  <div class="system-page">
    <div class="card">
      <h3 class="card-title">基本设置</h3>
      <p class="card-sub">展示在小程序与后台的基础信息</p>
      <div class="form-row">
        <span class="form-label">站点名称</span>
        <input class="form-input" value="途记旅行日记" />
      </div>
      <div class="form-row">
        <span class="form-label">联系邮箱</span>
        <input class="form-input" value="support@trail.cn" />
      </div>
      <div class="form-row">
        <span class="form-label">客服电话</span>
        <input class="form-input" value="400-820-1234" />
      </div>
    </div>

    <div class="card">
      <h3 class="card-title">审核设置</h3>
      <p class="card-sub">控制用户发布内容是否需要人工审核</p>
      <div class="switch-row">
        <div class="switch-info">
          <span class="switch-title">游记发布前需审核</span>
          <span class="switch-desc">开启后游记进入待审核状态</span>
        </div>
        <el-switch :model-value="auditJournal" @update:model-value="auditJournal = $event" />
      </div>
      <div class="switch-row">
        <div class="switch-info">
          <span class="switch-title">游记图片需审核</span>
          <span class="switch-desc">上传的图片先审核再展示</span>
        </div>
        <el-switch :model-value="auditImage" @update:model-value="auditImage = $event" />
      </div>
      <div class="switch-row">
        <div class="switch-info">
          <span class="switch-title">新用户注册需审核</span>
          <span class="switch-desc">关闭后注册即可直接注册</span>
        </div>
        <el-switch :model-value="auditUser" @update:model-value="auditUser = $event" />
      </div>
    </div>

    <button class="save-btn" @click="onSave">保存设置</button>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const auditJournal = ref(true)
const auditImage = ref(false)
const auditUser = ref(true)

function onSave() {
  alert('设置已保存')
}
</script>

<style scoped>
.system-page {
  display: flex;
  flex-direction: column;
  gap: 20px;
  max-width: 720px;
}
.card {
  background: #fff;
  border-radius: 12px;
  padding: 24px;
}
.card-title {
  font-size: 16px;
  font-weight: 700;
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
}
.form-label {
  width: 90px;
  font-size: 14px;
  color: #555;
}
.form-input {
  flex: 1;
  background: #f2f4f2;
  border: none;
  border-radius: 8px;
  padding: 10px 14px;
  font-size: 14px;
  outline: none;
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
.save-btn {
  width: 120px;
  padding: 10px;
  border: none;
  border-radius: 8px;
  background: #2e9e6b;
  color: #fff;
  font-size: 14px;
  cursor: pointer;
}
</style>
