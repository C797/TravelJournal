<template>
  <router-view />
</template>

<script setup lang="ts">
</script>

<style>
:root {
  --admin-green: #2e9e6b;
  --admin-green-dark: #1e4d3b;
  --admin-sidebar: #1e3a2f;
}
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}
html, body, #app {
  height: 100%;
  font-family: -apple-system, BlinkMacSystemFont, 'PingFang SC', 'Microsoft YaHei', sans-serif;
  background: #f5f6f5;
}
</style>
