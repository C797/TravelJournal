<template>
  <div class="manage-page">
    <div class="toolbar">
      <div class="filter-box"><input placeholder="搜索游记标题 / 作者" /></div>
      <div class="filter-select">全部状态 ▾</div>
      <button class="primary-btn">＋ 新增游记</button>
    </div>

    <div class="table-card">
      <el-table :data="journals" style="width: 100%">
        <el-table-column label="游记标题" prop="title" />
        <el-table-column label="作者" prop="author" />
        <el-table-column label="旅行册" prop="book" />
        <el-table-column label="字数" prop="words" />
        <el-table-column label="发布时间" prop="time" />
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
        <span class="total">共 28,654 篇游记</span>
        <div class="pagination">
          <span class="page">‹</span>
          <span class="page active">1</span>
          <span class="page">2</span>
          <span class="page">3</span>
          <span class="page">…</span>
          <span class="page">2,388</span>
          <span class="page">›</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const journals = [
  { title: '蓝色星球最后的净土', author: '旅行者小王', book: '川西之旅', words: '1,842', time: '2026-10-05 20:15', status: '正常' },
  { title: '在达古看一场雪', author: '周同学', book: '云南漫游', words: '1,260', time: '2026-09-28 19:40', status: '正常' },
  { title: '洱海边的下午', author: '陈小姐', book: '厦门周末', words: '968', time: '2026-09-12 15:30', status: '正常' },
  { title: '折多山日出', author: '李工', book: '西藏环线', words: '2,140', time: '2026-08-30 06:20', status: '禁用' }
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
