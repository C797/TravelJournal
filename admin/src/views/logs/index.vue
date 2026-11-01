<template>
  <div class="manage-page">
    <div class="toolbar">
      <div class="filter-select">最近 7 天 ▾</div>
      <div class="filter-select">全部操作 ▾</div>
      <button class="export-btn">↓ 导出日志</button>
    </div>

    <div class="table-card">
      <el-table :data="logs" style="width: 100%">
        <el-table-column label="时间" prop="time" />
        <el-table-column label="操作人" prop="operator" />
        <el-table-column label="操作内容" prop="content" />
        <el-table-column label="IP 地址" prop="ip" />
      </el-table>
    </div>
  </div>
</template>

<script setup lang="ts">
const logs = [
  { time: '2026-10-31 18:42', operator: '管理员', content: '删除用户「小红」', ip: '192.168.1.100' },
  { time: '2026-10-31 17:30', operator: '审核员', content: '通过游记「越南亚龙之行」', ip: '192.168.1.101' },
  { time: '2026-10-31 16:12', operator: '管理员', content: '导出账本账单数据 (川西之旅)', ip: '192.168.1.100' },
  { time: '2026-10-30 21:08', operator: '管理员', content: '封禁用户「李工」', ip: '192.168.1.100' },
  { time: '2026-10-30 15:44', operator: '审核员', content: '驳回游记「初见海海」', ip: '192.168.1.101' },
  { time: '2026-10-30 11:20', operator: '管理员', content: '修改审核设置：游记图片需审核', ip: '192.168.1.100' }
]
</script>

<style scoped>
.manage-page { display: flex; flex-direction: column; gap: 20px; }
.toolbar { display: flex; align-items: center; gap: 12px; }
.filter-select {
  background: #fff; border: 1px solid #e5e7eb; border-radius: 8px;
  padding: 8px 16px; font-size: 13px; color: #555; cursor: pointer;
}
.export-btn {
  margin-left: auto; padding: 8px 16px; border: 1px solid #e5e7eb; border-radius: 8px;
  background: #fff; color: #555; font-size: 13px; cursor: pointer;
}
.table-card { background: #fff; border-radius: 12px; padding: 20px; }
</style>
