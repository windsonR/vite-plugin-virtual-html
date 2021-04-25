import {defineConfig} from 'vite'
import VirtualHtml from './src'
import Vue from '@vitejs/plugin-vue'

const pages = {
  demo1: '/demo/demo1/demo1.html',
  demo2: '/demo/demo2/demo2.html',
}
export default defineConfig({
  plugins: [
    Vue(),
    VirtualHtml(pages, 'demo1'),
  ],
})
