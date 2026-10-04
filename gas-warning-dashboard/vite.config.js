import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import os from 'node:os'

function getLocalIp() {
  const nets = os.networkInterfaces()
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      if (net.family === 'IPv4' && !net.internal) {
        return net.address
      }
    }
  }
  return 'safeflame.local'
}

const localIp = getLocalIp()

function customDomainBanner() {
  return {
    name: 'custom-domain-banner',
    configureServer(server) {
      server.httpServer?.once('listening', () => {
        const port = server.config.server.port || 5173
        setTimeout(() => {
          console.log(`\n  \x1b[36m🔥 SafeFlame Dashboard:\x1b[0m \x1b[1m\x1b[32mhttp://safeflame.vn:${port}/\x1b[0m`)
          console.log(`  \x1b[90m➜  Localhost dự phòng:\x1b[0m   http://localhost:${port}/\n`)
        }, 100)
      })
    }
  }
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    customDomainBanner(),
  ],
  server: {
    port: 5173, // Cổng 5173 ổn định tuyệt đối trên Windows
    host: true, // Mở mạng LAN
    open: true, // Tự động bật trình duyệt khi khởi chạy
    allowedHosts: true, // Cho phép truy cập qua safeflame.vn, localhost, v.v.
  },
  define: {
    __DETECTED_IP__: JSON.stringify(localIp),
  }
})