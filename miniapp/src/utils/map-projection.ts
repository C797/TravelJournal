// 经纬度 -> 地图坐标（与 simplemaps 全国底图严格对齐）
//
// simplemaps 中国地图数据的坐标系统（实测 34 个省级行政区 path 反推）：
//   - viewBox: 0 0 1000 738
//   - 全国 path 坐标范围：x 45.5 ~ 954.5，y 33.6 ~ 704.7
//   - 经度方向：线性映射  x = 14.6613 * lng - 1024.77   （73°E ~ 135°E）
//   - 纬度方向：墨卡托投影 y = -851.37 * merc(lat) + 978.12
//     （已用黑龙江 53.5°N、云南 21.1°N、北京 39.9°N 等多个已知点校准，误差 < 1px）
//
// 首页点位、标注点管理页点位与弹窗统一走这里，避免各自写公式导致错位。

function mercator(lat: number) {
  return Math.log(Math.tan(Math.PI / 4 + (lat * Math.PI) / 360))
}

const AX = 14.6613
const BX = -1024.77
const AY = -851.37
const BY = 978.12

/** 返回地图 viewBox 坐标系（0 0 1000 738）中的 x/y 像素坐标 */
export function toXY(lng: number, lat: number) {
  return {
    x: AX * lng + BX,
    y: AY * mercator(lat) + BY
  }
}

/** 返回 left/top 百分比字符串（如 "44.62%"），可直接用于 style，供全国底图（1000×738）使用 */
export function project(lng: number, lat: number) {
  const p = toXY(lng, lat)
  return {
    left: `${((p.x / 1000) * 100).toFixed(3)}%`,
    top: `${((p.y / 738) * 100).toFixed(3)}%`
  }
}

// ===== 省级地图投影（通用） =====
//
// 省级地图底图由运行时 SVG 渲染：取该省 path 的包围盒 [bx0,by0,bx1,by1]，
// 加边距 PAD 后作为 SVG 的 viewBox。点位仍在同一个全国 viewBox 坐标系里，
// 只是换算成「相对该省 viewBox」的百分比坐标即可，无需为每个省单独拟合投影。

export interface ProvinceBounds {
  x0: number
  y0: number
  x1: number
  y1: number
}

const PAD = 25

/** 计算某省 SVG 底图的 viewBox（含边距），供生成 SVG 和投影共用 */
export function provinceViewBox(bounds: ProvinceBounds) {
  return {
    x: bounds.x0 - PAD,
    y: bounds.y0 - PAD,
    w: bounds.x1 - bounds.x0 + PAD * 2,
    h: bounds.y1 - bounds.y0 + PAD * 2
  }
}

/** 经纬度 -> 某省省级地图内的百分比坐标（left/top） */
export function projectProvince(lng: number, lat: number, bounds: ProvinceBounds) {
  const p = toXY(lng, lat)
  const vb = provinceViewBox(bounds)
  return {
    left: `${(((p.x - vb.x) / vb.w) * 100).toFixed(3)}%`,
    top: `${(((p.y - vb.y) / vb.h) * 100).toFixed(3)}%`
  }
}

/** 省级地图左上角定位（供把某省底图缩略到全国图上时使用），返回全国图上的百分比坐标 */
export function projectProvinceOrigin(bounds: ProvinceBounds) {
  const vb = provinceViewBox(bounds)
  return {
    left: `${((vb.x / 1000) * 100).toFixed(3)}%`,
    top: `${((vb.y / 738) * 100).toFixed(3)}%`
  }
}
