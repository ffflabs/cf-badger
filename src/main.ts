import 'windi.css'
import './styles/main.css'
import vitedge from 'vitedge'
import generatedRoutes from 'virtual:generated-pages'
import { setupLayouts } from 'virtual:generated-layouts'
import { installI18n, extractLocaleFromPath, DEFAULT_LOCALE } from './i18n'
import App from './App.vue'

const routes = setupLayouts(generatedRoutes)
console.log({ env: import.meta.env })
// https://github.com/frandiox/vitedge
export default vitedge(
  App,
  {
    routes,
    // Use Router's base for i18n routes
    base: ({ url }) => {
      console.log({ url, env: import.meta.env })

      return '/'
    },
  },
  async (ctx) => {
    console.log({ VITEDGE_API_URL: import.meta.env.VITE_VITEDGE_API_URL, VITE_API_URL: import.meta.env.VITE_API_URL })
    // install all modules under `modules/`

    // const { app, initialRoute } = ctx

    // Load language asyncrhonously to avoid bundling all languages
    // await installI18n(app, extractLocaleFromPath(initialRoute.href))
  }
)

