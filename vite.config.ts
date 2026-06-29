import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { NaiveUiResolver } from 'unplugin-vue-components/resolvers'
import { fileURLToPath, URL } from 'node:url'
import path from 'node:path'

/** 创建代理配置：透传认证头到 Rocket.Chat */
function createProxy(target: string, extra?: Record<string, any>) {
  return {
    target,
    changeOrigin: true,
    ...extra,
    configure(proxy: any) {
      proxy.on('proxyReq', (proxyReq: any, req: any) => {
        const authToken = req.headers['x-auth-token']
        const userId = req.headers['x-user-id']
        if (authToken) proxyReq.setHeader('X-Auth-Token', authToken)
        if (userId) proxyReq.setHeader('X-User-Id', userId)
      })
    }
  }
}

export default defineConfig({
  plugins: [
    vue(),
    vueJsx(),
    AutoImport({
      imports: [
        'vue',
        'vue-router',
        'pinia',
        {
          'naive-ui': [
            'useDialog',
            'useMessage',
            'useNotification',
            'useLoadingBar'
          ]
        }
      ],
      dts: 'auto-imports.d.ts',
      dirs: ['src/composables', 'src/stores']
    }),
    Components({
      resolvers: [NaiveUiResolver()],
      dts: 'components.d.ts'
    })
  ],

  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },

  css: {
    preprocessorOptions: {
      less: {
        javascriptEnabled: true,
        additionalData: ''
      }
    }
  },

  server: {
    port: 5173,
    host: '0.0.0.0',
    proxy: {
      '/api': createProxy('http://192.168.1.189:3000'),
      '/websocket': createProxy('http://192.168.1.189:3000', { ws: true }),
      '/file-upload': createProxy('http://192.168.1.189:3000'),
      '/avatar': createProxy('http://192.168.1.189:3000'),
      '/ufs': createProxy('http://192.168.1.189:3000'),
      '/images': createProxy('http://192.168.1.189:3000')
    }
  },

  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    chunkSizeWarningLimit: 1000
  }
})
