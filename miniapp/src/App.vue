<script setup lang="ts">
import { onLaunch } from '@dcloudio/uni-app'

onLaunch(() => {
  console.log('途记 TravelJournal 启动')
})
</script>

<style lang="scss">
/* 全局样式与设计变量 */
page {
  --tj-green: #2E9E6B;
  --tj-green-dark: #1E7A50;
  --tj-green-light: #E8F3EC;
  --tj-orange: #FF8A00;
  --tj-bg: #F2F4F1;
  --tj-text: #1A1A1A;
  --tj-text-secondary: #999999;
  --tj-text-tertiary: #B0B0B0;
  --tj-card: #FFFFFF;
  --tj-ink: #1E3A2F;

  background-color: #F2F4F1;
  color: #1A1A1A;
  font-family: -apple-system, BlinkMacSystemFont, 'PingFang SC', 'Helvetica Neue', 'Microsoft YaHei', sans-serif;
  font-size: 28rpx;
  line-height: 1.6;
}

view, text, image, scroll-view, input, textarea, button {
  box-sizing: border-box;
}

/* 通用卡片 */
.tj-card {
  background: #FFFFFF;
  border-radius: 32rpx;
  overflow: hidden;
}

/* 通用胶囊按钮 */
.tj-btn-primary {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 96rpx;
  border-radius: 48rpx;
  background: linear-gradient(135deg, #34A866, #2E9E6B);
  color: #FFFFFF;
  font-size: 32rpx;
  font-weight: 600;
  letter-spacing: 2rpx;
  border: none;
  &::after {
    border: none;
  }
}

.tj-btn-plain {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 96rpx;
  border-radius: 48rpx;
  background: #FFFFFF;
  color: #2E9E6B;
  font-size: 32rpx;
  font-weight: 600;
  border: 2rpx solid #2E9E6B;
  &::after {
    border: none;
  }
}

/* 状态标签 */
.tj-tag {
  display: inline-flex;
  align-items: center;
  padding: 4rpx 20rpx;
  border-radius: 999rpx;
  font-size: 22rpx;
  &.tag-green {
    background: #E3F2E8;
    color: #2E9E6B;
  }
  &.tag-orange {
    background: #FDEEE3;
    color: #E8853D;
  }
  &.tag-gray {
    background: #F0F0F0;
    color: #999999;
  }
}

/* 通用页面容器（自定义导航栏下） */
.tj-page {
  min-height: 100vh;
  padding: 0 32rpx;
  padding-bottom: 160rpx;
}

/* 自定义导航栏 */
.tj-nav {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 88rpx;
  padding: 0 24rpx;
  .tj-nav-title {
    font-size: 34rpx;
    font-weight: 700;
    color: #1A1A1A;
  }
  .tj-nav-back {
    position: absolute;
    left: 24rpx;
    width: 64rpx;
    height: 64rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 44rpx;
    color: #1A1A1A;
  }
  .tj-nav-action {
    position: absolute;
    right: 24rpx;
    font-size: 28rpx;
    color: #999999;
  }
}

/* 分割线 */
.tj-divider {
  height: 1rpx;
  background: #F0F0F0;
  margin: 20rpx 0;
}
</style>
