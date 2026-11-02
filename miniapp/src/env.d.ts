/// <reference types="@dcloudio/types" />

declare module '*.vue' {
  import { DefineComponent } from 'vue'
  const component: DefineComponent<{}, {}, any>
  export default component
}

interface ImportMetaEnv {
  readonly VITE_API_BASE?: string
  /** 小程序 AppID：配置后微信登录走真实 jscode2session，留空则用本地演示账号 */
  readonly VITE_WX_APPID?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
