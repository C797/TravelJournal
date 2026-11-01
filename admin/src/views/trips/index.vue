<template>
  <div class="manage-page">
    <div class="toolbar">
      <div class="filter-box"><input placeholder="搜索旅行册 / 所有者" /></div>
      <div class="filter-select">全部状态 ▾</div>
      <button class="primary-btn">＋ 新增旅行册</button>
    </div>

    <div class="table-card">
      <el-table :data="trips" style="width: 100%">
        <el-table-column label="旅行册" prop="name" />
        <el-table-column label="所有者" prop="owner" />
        <el-table-column label="相连点" prop="spots" />
        <el-table-column label="游记" prop="journals" />
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
        <span class="total">共 3,892 本旅行册</span>
        <div class="pagination">
          <span class="page">‹</span>
          <span class="page active">1</span>
          <span class="page">2</span>
          <span class="page">3</span>
          <span class="page">…</span>
          <span class="page">325</span>
          <span class="page">›</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const trips = [
  { name: '川西之旅', owner: '旅行者小王', spots: '12', journals: '8', time: '2026-06-15', status: '正常' },
  { name: '云南漫游', owner: '周同学', spots: '6', journals: '5', time: '2026-07-02', status: '正常' },
  { name: '厦门周末', owner: '陈小姐', spots: '5', journals: '4', time: '2026-05-20', status: '正常' },
  { name: '西藏环线', owner: '李工', spots: '9', journals: '11', time: '2026-08-11', status: '禁用' }
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
