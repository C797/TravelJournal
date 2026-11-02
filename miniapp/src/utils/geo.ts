// 定位与行政区解析
//
// 微信 chooseLocation 只返回 { name, address, latitude, longitude }，不直接给省/市。
// 前端用 address 里的行政层级自行解析：
// - province 必须与 china-map-data 的 provinces[].name 完全一致（短名，如「四川」），
//   否则标注点归不到全国地图的对应省份；
// - city 仅用于展示，做适度简化（「甘孜藏族自治州」→「甘孜」）。
import { provinces } from '@/components/china-map-data'

export interface PickedLocation {
  name: string
  address: string
  latitude: number
  longitude: number
  province: string
  city: string
}

// 直辖市没有「××省」前缀，市级就是它本身
const MUNICIPALITIES = ['北京', '上海', '天津', '重庆']

// 自治州名里的民族修饰，用于把「甘孜藏族自治州」简化成「甘孜」
const ETHNIC =
  /(蒙古族|藏族|彝族|苗族|壮族|回族|傣族|白族|哈尼族|土家族|羌族|侗族|布依族|朝鲜族|景颇族|傈僳族|拉祜族|纳西族|瑶族|畲族|水族|仡佬族|黎族|满族|维吾尔|哈萨克|柯尔克孜|锡伯|塔吉克|怒族|德昂族|阿昌族|普米族|独龙族|基诺族|布朗族)/

/** 省名按名字长度倒序匹配，避免「海南」被「南海」之类的短名抢先命中 */
const PROVINCE_BY_LEN = [...provinces].sort((a, b) => b.name.length - a.name.length)

/** 从地址文本解析省（短名，如「四川」），解析不到返回空串 */
export function parseProvince(text: string): string {
  if (!text) return ''
  for (const p of PROVINCE_BY_LEN) {
    if (text.includes(p.name)) return p.name
  }
  return ''
}

/** 从地址文本解析市（简化名，如「甘孜」「杭州」），解析不到返回空串 */
export function parseCity(text: string, province = ''): string {
  if (!text) return ''

  // 直辖市：北京市朝阳区 → 北京
  if (province && MUNICIPALITIES.includes(province)) return province

  // 省 / 自治区之后的第一个地级单位
  const m = text.match(/(?:省|自治区)([^省市]+?(?:自治州|地区|市|盟))/)
  if (m) {
    return m[1]
      .replace(ETHNIC, '')
      .replace(/(自治州|地区|盟|市)$/, '')
      .trim()
  }

  // 没有省前缀时退一步：直接取「××市」
  const m2 = text.match(/([^省市]+?市)/)
  if (m2) return m2[1].replace(/市$/, '')
  return ''
}

/** 组装 chooseLocation 的返回结果 */
export function buildPicked(res: any): PickedLocation {
  const name: string = res?.name || ''
  const address: string = res?.address || ''
  const text = `${address}${name}`
  const province = parseProvince(text)
  return {
    name: name || address || '未命名地点',
    address,
    latitude: Number(res?.latitude) || 0,
    longitude: Number(res?.longitude) || 0,
    province,
    city: parseCity(address || text, province)
  }
}

/**
 * 取当前定位（gcj02，与 chooseLocation 坐标系一致）。
 * 失败不抛错：拿不到定位时只是选点地图不预居中，功能仍可用。
 */
export function getCurrentLocation(): Promise<{ latitude: number; longitude: number } | null> {
  return new Promise((resolve) => {
    uni.getLocation({
      type: 'gcj02',
      success: (res: any) => {
        const lat = Number(res?.latitude)
        const lng = Number(res?.longitude)
        if (Number.isFinite(lat) && Number.isFinite(lng) && lat && lng) {
          resolve({ latitude: lat, longitude: lng })
        } else {
          resolve(null)
        }
      },
      fail: () => resolve(null)
    })
  })
}

/** 打开微信选点地图，默认居中在当前定位（拿不到定位则由微信自己决定） */
export function chooseLocation(center?: { latitude: number; longitude: number } | null) {
  return new Promise<PickedLocation | null>((resolve) => {
    const opts: any = {
      success: (res: any) => resolve(buildPicked(res)),
      fail: (err: any) => {
        // 用户取消不算失败
        if (String(err?.errMsg || '').includes('cancel')) return resolve(null)
        uni.showToast({ title: '打开地图失败，请检查定位权限', icon: 'none' })
        resolve(null)
      }
    }
    if (center) {
      opts.latitude = center.latitude
      opts.longitude = center.longitude
    }
    uni.chooseLocation(opts)
  })
}
