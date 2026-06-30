import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'


export default defineConfig(() => {
  const isProduction = process.env.NODE_ENV === 'production';
  const keyPath = path.resolve(__dirname, 'ssl/localhost.key');
  const certPath = path.resolve(__dirname, 'ssl/localhost.crt');


  const useHttps = !isProduction && fs.existsSync(keyPath) && fs.existsSync(certPath);

  return {
    plugins: [react()],
    server: {
      port: 3000,

      https: useHttps ? {
        key: fs.readFileSync(keyPath),
        cert: fs.readFileSync(certPath),
      } : false,
      proxy: {
        '/api': {
          target: 'http://localhost:8080',
          changeOrigin: true,
          secure: false
        }
      }
    }
  }
})
