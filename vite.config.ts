import {defineConfig} from 'vite'
import VirtualHtml from './src'
import Vue from '@vitejs/plugin-vue'
import Inspect from 'vite-plugin-inspect'
// @ts-ignore
import ejs from 'ejs'
import {POS} from './src/html/types';

export default defineConfig({
  resolve: {
    alias: {
      'vue': 'vue/dist/vue.esm-bundler.js'
    }
  },
  plugins: [
    Inspect(),
    Vue(),
    VirtualHtml({
      pages: {
        // demo1 is the html name you access in browser
        demo1: {
          template: '/demo/demo1/demo1.html',
          data: {
            users: ['a','b','c']
          }
        },
        'demo1/index': '/demo/demoIndex1.html',
        'demo2/': '/demo/demoIndex2.html',
        demo2: '/demo/demo2/demo2.html',
        demo3: {
          template: '/demo/demo3.html'
        },
        demo4: {
          template: '/demo/template.html',
          data: {
            script: '<script type="module" src="/demo/demo1/demo1.ts"></script>'
          }
        },
        'demo1/demo2/demo5': { // multi-level directories, the last (demo5) will be the html name
          template: '/demo/template.html',
          data: {
            script: '<script type="module" src="/demo/demo1/demo1.ts"></script>'
          }
        },
        demo6: {
          entry: '/demo/demo1/demo1.ts',
        },
        demo7: {
          entry: '/demo/demo1/demo1.ts',
          title: 'demo7',
          body: '<div id="app"></div>'
        },
      },
      data: {
        users: ['a', 'b', 'c'],
        script: '<script type="module" src="/demo/demo1/demo1.ts"></script>'
      },
      indexPage: 'demo1',
      // global render, from 0.3.0 it (this demo code) will auto configure in plugin, and you MUST install 'ejs' in your project to use it.
      // render(template,data){
      //   return ejs.render(template, data, {delimiter: '%', root: process.cwd()})
      // },
      // pages: true, // when pages set to true, plugin will use extraGlobPattern to glob html file
      // extraGlobPattern: [
      //   '**/*.html',
      //   '!node_modules/**/*.html',
      //   '!.**/*.html',
      //   '!dist/**/*.html'
      // ],
      injectCode: {
        'demo1.html': {
          pos: POS.after,
          find: '<head>',
          replacement: '<script>window.dd = "dd";</script>'
        },
        '*': {
          pos: POS.after,
          find: '<head>',
          replacement: '<script>window.dd = "bbb";</script>'
        },
      },
      // rewrites: [
      //   {
      //     from: /.*/g,
      //     to: ''
      //   }
      // ]
    }),
  ],
  optimizeDeps: {
    force: true
  }
})
