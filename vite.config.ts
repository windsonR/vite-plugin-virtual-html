import {defineConfig} from 'vite'
import VirtualHtml from './src'
import Vue from '@vitejs/plugin-vue'
// @ts-ignore
import ejs from 'ejs'

export default defineConfig({
  resolve:{
    alias: {
      'vue': 'vue/dist/vue.esm-bundler.js'
    }
  },
  plugins: [
    Vue(),
    VirtualHtml({
      pages: {
        demo1: {
          html: '/demo/demo1/demo1.html',
          data: {
            users: ['a','b','c']
          }
        },
        demo2: '/demo/demo2/demo2.html',
      },
      indexPage: 'demo1',
      render(template,data){
        return ejs.render(template, data, {delimiter: '$'})
      }
    }),
  ],
})
