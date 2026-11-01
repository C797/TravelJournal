<template>
  <div class="manage-page">
    <div class="toolbar">
      <div class="filter-box">
        <input placeholder="搜索昵称 / 手机号" />
      </div>
      <div class="filter-select">全部状态 ▾</div>
      <button class="primary-btn">＋ 新增用户</button>
    </div>

    <div class="table-card">
      <el-table :data="users" style="width: 100%">
        <el-table-column label="用户">
          <template #default="{ row }">
            <div class="user-cell">
              <div class="avatar" :style="{ background: row.color }">{{ row.initial }}</div>
              <span>{{ row.name }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="手机号" prop="phone" />
        <el-table-column label="旅行册" prop="books" />
        <el-table-column label="游记" prop="journals" />
        <el-table-column label="注册时间" prop="time" />
        <el-table-column label="状态">
          <template #default="{ row }">
            <span class="status-tag" :class="row.status === '正常' ? 'tag-green' : 'tag-gray'">{{ row.status }}</span>
          </template>
        </el-table-column>
        <el-table-column label="操作">
          <template #default>
            <span class="detail-link">查看</span>
          </template>
        </el-table-column>
      </el-table>
      <div class="table-footer">
        <span class="total">共 12,486 位用户</span>
        <div class="pagination">
          <span class="page">‹</span>
          <span class="page active">1</span>
          <span class="page">2</span>
          <span class="page">3</span>
          <span class="page">…</span>
          <span class="page">417</span>
          <span class="page">›</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const users = [
  { name: '旅行者小王', phone: '138****5678', books: '3', journals: '17', time: '2026-10-31 14:23', status: '正常', initial: '王', color: '#d6eadd' },
  { name: '周同学', phone: '139****1234', books: '2', journals: '9', time: '2026-10-30 09:12', status: '正常', initial: '周', color: '#f5e3d0' },
  { name: '陈小姐', phone: '137****9999', books: '1', journals: '4', time: '2026-10-29 18:40', status: '正常', initial: '陈', color: '#d6def0' },
  { name: '李工', phone: '136****2211', books: '4', journals: '26', time: '2026-10-28 11:05', status: '禁用', initial: '李', color: '#e0e0e0' }
]
</script>

<style scoped>
.manage-page {
  display: flex;
  flex-direction: column;
  gap: 20px;
}
.toolbar {
  display: flex;
  align-items: center;
  gap: 12px;
}
.filter-box {
  display: flex;
  align-items: center;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 8px 14px;
  width: 260px;
}
.filter-box input {
  border: none;
  outline: none;
  font-size: 13px;
  width: 100%;
}
.filter-select {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 8px 16px;
  font-size: 13px;
  color: #555;
  cursor: pointer;
}
.primary-btn {
  margin-left: auto;
  padding: 8px 20px;
  border: none;
  border-radius: 8px;
  background: #16a34a;
  color: #fff;
  font-size: 13px;
  cursor: pointer;
}
.table-card {
  background: #fff;
  border-radius: 12px;
  padding: 20px;
}
.user-cell {
  display: flex;
  align-items: center;
  gap: 10px;
  font-weight: 600;
}
.avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 700;
}
.status-tag {
  padding: 2px 10px;
  border-radius: 10px;
  font-size: 12px;
}
.tag-green { background: #e7f6ee; color: #16a34a; }
.tag-gray { background: #f0f0f0; color: #999; }
.detail-link { color: #16a34a; cursor: pointer; }
.table-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 16px;
}
.total { font-size: 13px; color: #999; }
.pagination {
  display: flex;
  gap: 6px;
}
.page {
  width: 28px;
  height: 28px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  cursor: pointer;
  color: #555;
}
.page.active {
  background: #16a34a;
  color: #fff;
}
</style>
