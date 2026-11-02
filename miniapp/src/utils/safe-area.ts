// 顶部安全区适配：所有机型（刘海屏 / 灵动岛 / 打孔屏 / 普通屏）统一读取系统状态栏高度
// 页面均为 navigationStyle: custom，因此顶部留白必须由 JS 读取后注入，不能写死 rpx

type SizeInfo = {
  statusBarHeight?: number
  windowWidth?: number
  screenHeight?: number
  safeArea?: { bottom?: number }
  safeAreaInsets?: { top?: number; bottom?: number }
}

function readSystemInfo(): SizeInfo {
  try {
    // 新版 API 优先
    const w: any = (uni as any).getWindowInfo?.()
    if (w && typeof w.statusBarHeight === 'number') return w
  } catch (e) {
    /* ignore */
  }
  try {
    return uni.getSystemInfoSync() as SizeInfo
  } catch (e) {
    return {}
  }
}

const info = readSystemInfo()

/**
 * 状态栏高度（px，仅小程序 / App 有效）
 * iPhone 刘海 44~54、灵动岛 54、安卓打孔 24~40、无状态栏机型为 0
 */
export const STATUS_BAR_HEIGHT = (() => {
  const h = info.statusBarHeight || info.safeAreaInsets?.top || 0
  // 兜底：个别安卓机返回 0，给一个最小值避免内容顶到屏幕边缘
  return h > 0 ? h : 20
})()

/**
 * 状态栏占位样式
 * - 小程序 / App：系统真实状态栏高度（px）
 * - H5：浏览器没有状态栏，用与设计稿一致的 60rpx 留白（随窗口缩放）
 */
export const statusBarStyle = (() => {
  // #ifdef H5
  return { height: '60rpx' }
  // #endif
  // #ifndef H5
  return { height: `${STATUS_BAR_HEIGHT}px` }
  // #endif
})()

/** 沉浸式头图 / 封面上的圆形按钮，需要避开状态栏 */
export const overlayNavStyle = (() => {
  // #ifdef H5
  return { paddingTop: '60rpx' }
  // #endif
  // #ifndef H5
  return { paddingTop: `${STATUS_BAR_HEIGHT + 10}px` }
  // #endif
})()

/**
 * 微信小程序右上角胶囊按钮占位（px）
 * 页面均为自定义导航，右上角若有按钮 / 内容必须让开胶囊，否则会被压住点不到
 * 其他端返回 0，不做任何偏移
 */
export const MENU_INSET_RIGHT = (() => {
  // #ifndef MP-WEIXIN
  return 0
  // #endif
  // #ifdef MP-WEIXIN
  try {
    const rect = (uni as any).getMenuButtonBoundingClientRect?.()
    const winW = (info as any).windowWidth || 375
    if (rect && rect.left) return Math.max(0, Math.round(winW - rect.left + 8))
  } catch (e) {
    /* ignore */
  }
  return 104
  // #endif
})()

/** 顶部条（flex 布局）让开胶囊：设置右内边距 */
export const navRightStyle =
  MENU_INSET_RIGHT > 0 ? { paddingRight: `${MENU_INSET_RIGHT}px` } : {}

/** 绝对定位在右上角的元素让开胶囊：设置 right */
export const menuRightStyle =
  MENU_INSET_RIGHT > 0 ? { right: `${MENU_INSET_RIGHT}px` } : {}
