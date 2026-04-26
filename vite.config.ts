import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Repo name on GitHub Pages — change if the repo is renamed.
const REPO = 'alife'

export default defineConfig({
  plugins: [react()],
  base: process.env.GITHUB_ACTIONS ? `/${REPO}/` : '/',
})
