import {defineConfig} from 'vite'
import VirtualHtml from './src/plugin'
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
      // pages: {
      //   // demo1 is the html name you access in browser
      //   demo1: {
      //     template: '/demo/demo1/demo1.html',
      //     data: {
      //       users: ['a','b','c']
      //     }
      //   },
      //   demo2: '/demo/demo2/demo2.html',
      //   // demo2: {
      //   //   template: '/demo/demo2/demo2.html'
      //   // },
      //   demo3: '/demo3.html',
      //   demo4: {
      //     template: '/demo/template.html',
      //     data: {
      //       script: '<script type="module" src="/demo/demo1/demo1.ts"></script>'
      //     }
      //   },
      // },
      // pages: true,
      data:{
        users: ['a','b','c'],
        script: '<script type="module" src="/demo/demo1/demo1.ts"></script>'
      },
      indexPage: 'demo1',
      render(template,data){
        return ejs.render(template, data, {delimiter: '$', root: process.cwd()})
      }
    }),
  ],
})
