/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly API_URL?: string
  readonly IDEMPOTENCY_TIME?: string
  readonly IDEMPOTENCY_TIME_SECONDS?: string
  readonly VITE_API_URL?: string
  readonly VITE_IDEMPOTENCY_TIME?: string
  readonly VITE_IDEMPOTENCY_TIME_WINDOW_SECONDS?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<{}, {}, any>
  export default component
}
