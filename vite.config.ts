import {defineConfig} from 'vite'
import VirtualHtml from './src'
import Vue from '@vitejs/plugin-vue'

const pages = {
  demo1: {
    html: '/demo/demo1/demo1.html',
  },
  demo2: '/demo/demo2/demo2.html',
}
export default defineConfig({
  resolve:{
    alias: {
      'vue': 'vue/dist/vue.esm-bundler.js'
    }
  },
  plugins: [
    Vue(),
    VirtualHtml({
      pages,
      indexPage: 'demo1',
    }),
  ],
})
