import react from '@vitejs/plugin-react'
import { resolve } from 'node:path'
import { defineConfig, type Plugin } from 'vite'
import fs from "node:fs"

// ドキュメントルート（リポジトリのルート）直下に置く
// ドットファイルなので .htaccess の非公開ルールで自動的に隠れる
const HOT = resolve(import.meta.dirname, "../../.vite-hot")

// ビルド成果物はドキュメントルート直下の dist/ に出力する
// （本番はビルドせずそのままアップロードするため、dist/ はコミット対象）
const OUT_DIR = resolve(import.meta.dirname, "../../dist")

function hotFile(): Plugin {
  return {
    name: "hot-file",
    configureServer(server) {
      const url = "http://localhost:5173"
      server.httpServer?.once("listening", () => fs.writeFileSync(HOT, url))
      const clean = () => { try { fs.unlinkSync(HOT) } catch {} }
      process.on("exit", clean)
      process.on("SIGINT", () => { clean(); process.exit() })
      process.on("SIGTERM", () => { clean(); process.exit() })
    }
  }
}

// https://vite.dev/config/
export default defineConfig(({command}) => ({
  plugins: [
    react(),
    hotFile()
  ],
  resolve: {
    tsconfigPaths: true,
  },
  base: command === 'build' ? '/dist/' : '/',
  publicDir: false,
  server: {
    // コンテナの外（ホストの 127.0.0.1:5173）から届くように、全インターフェースで待ち受ける
    host: true,
    port: 5173,
    strictPort: true,
    cors: true,
    origin: "http://localhost:5173"
  },
  build: {
    outDir: OUT_DIR,
    emptyOutDir: true,
    manifest: true,
    rolldownOptions: {
      input: "src/main.tsx"
    }
  },
}))
