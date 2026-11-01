<template>
  <div class="manage-page">
    <div class="toolbar">
      <div class="filter-box"><input placeholder="搜索账本 / 旅行册" /></div>
      <div class="filter-select">全部状态 ▾</div>
      <button class="primary-btn">＋ 新建账本</button>
    </div>

    <div class="table-card">
      <el-table :data="ledgers" style="width: 100%">
        <el-table-column label="账本名称" prop="name" />
        <el-table-column label="所属旅行册" prop="book" />
        <el-table-column label="成员" prop="members" />
        <el-table-column label="账单数" prop="bills" />
        <el-table-column label="创建时间" prop="time" />
        <el-table-column label="状态">
          <template #default="{ row }">
            <span class="status-tag" :class="row.status === '正常' ? 'tag-green' : 'tag-gray'">{{ row.status }}</span>
          </template>
        </el-table-column>
        <el-table-column label="操作">
          <template #default><span class="detail-link">查看</span></template>
        </el-table-column>
      </el-table>
      <div class="table-footer">
        <span class="total">共 26,132 个账本</span>
        <div class="pagination">
          <span class="page">‹</span>
          <span class="page active">1</span>
          <span class="page">2</span>
          <span class="page">3</span>
          <span class="page">…</span>
          <span class="page">2,178</span>
          <span class="page">›</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const ledgers = [
  { name: '川西之旅账本', book: '川西之旅', members: '3 人', bills: '32', time: '2026-06-15', status: '正常' },
  { name: '云南漫游账本', book: '云南漫游', members: '2 人', bills: '18', time: '2026-07-02', status: '正常' },
  { name: '厦门周末账本', book: '厦门周末', members: '2 人', bills: '9', time: '2026-05-20', status: '正常' },
  { name: '西藏环线账本', book: '西藏环线', members: '4 人', bills: '41', time: '2026-08-11', status: '禁用' }
]
</script>

<style scoped>
.manage-page { display: flex; flex-direction: column; gap: 20px; }
.toolbar { display: flex; align-items: center; gap: 12px; }
.filter-box {
  display: flex; align-items: center; background: #fff; border: 1px solid #e5e7eb;
  border-radius: 8px; padding: 8px 14px; width: 260px;
}
.filter-box input { border: none; outline: none; font-size: 13px; width: 100%; }
.filter-select {
  background: #fff; border: 1px solid #e5e7eb; border-radius: 8px;
  padding: 8px 16px; font-size: 13px; color: #555; cursor: pointer;
}
.primary-btn {
  margin-left: auto; padding: 8px 20px; border: none; border-radius: 8px;
  background: #16a34a; color: #fff; font-size: 13px; cursor: pointer;
}
.table-card { background: #fff; border-radius: 12px; padding: 20px; }
.status-tag { padding: 2px 10px; border-radius: 10px; font-size: 12px; }
.tag-green { background: #dcfce7; color: #16a34a; }
.tag-gray { background: #f0f0f0; color: #999; }
.detail-link { color: #16a34a; cursor: pointer; }
.table-footer { display: flex; align-items: center; justify-content: space-between; margin-top: 16px; }
.total { font-size: 13px; color: #999; }
.pagination { display: flex; gap: 6px; }
.page {
  width: 28px; height: 28px; border-radius: 6px; display: flex; align-items: center;
  justify-content: center; font-size: 13px; cursor: pointer; color: #555;
}
.page.active { background: #16a34a; color: #fff; }
</style>
