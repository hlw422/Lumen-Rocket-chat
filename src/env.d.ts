/// <reference types="vite/client" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<{}, {}, any>
  export default component
}

interface ImportMetaEnv {
  readonly VITE_BASE_API: string
  readonly VITE_SOCKET_API: string
  readonly VITE_BASE: string
  readonly VITE_ROUTER_MODE: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
