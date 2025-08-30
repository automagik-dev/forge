import { sentryVitePlugin } from "@sentry/vite-plugin";
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  
  return {
    plugins: [react(), sentryVitePlugin({
      org: "namastex-labs",
      project: "automagik-forge",
      authToken: env.SENTRY_AUTH_TOKEN
    })],

    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
        "shared": path.resolve(__dirname, "../shared"),
      },
    },

    server: {
      port: parseInt(env.FRONTEND_PORT || '3000'),
      proxy: {
        '/api': {
          target: `http://localhost:${env.BACKEND_PORT || '3001'}`,
          changeOrigin: true,
        },
      },
    },

    build: {
      sourcemap: true
    }
  }
})
