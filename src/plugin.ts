// noinspection UnnecessaryLocalVariableJS

import {Plugin, ViteDevServer} from 'vite'
import {cwd, PluginOptions} from './types'
import {generatePageOptions, generateUrl, readHtml} from './devUtils'
import {extractHtmlPath, getHtmlName} from './buildUtils'
import path from 'path'
import fs, {promises as fsp} from 'fs'

export default (virtualHtmlOptions: PluginOptions): Plugin => {
  const {
    pages,
    indexPage = 'index',
    render: globalRender = (template: string) => template,
    data: globalData = {},
  } = virtualHtmlOptions
  let distDir: string
  const needRemove:Array<string> = []
  return {
    name: 'vite-plugin-virtual-html',
    configureServer(server: ViteDevServer) {
      // other html handled after vite's inner middlewares.
      return () => {
        server.middlewares.use('/', async (req, res, next) => {
          const url = decodeURI(generateUrl(req.url))
          // if request is not html , directly return next()
          if (!url.endsWith('.html') && url !== '/') {
            return next()
          }
          // if request / means it request indexPage page
          // read indexPage config ,and response indexPage page
          let page
          if (url === '/' || url.indexOf('index.html') >= 0) {
            page = await generatePageOptions(pages[indexPage], globalData, globalRender)
          } else {
            page = await generatePageOptions(pages[getHtmlName(url)], globalData, globalRender)
          }
          res.end(await server.transformIndexHtml(url, await readHtml(page)))
        })
      }
    },
    async config(config, {command}) {
      if (command === 'build') {
        const allPage = Object.entries(pages)
        // copy all html which is not under project root
        for (const [key,value] of allPage) {
          const pageOption = await generatePageOptions(value, globalData, globalRender)
          const vHtml = path.resolve(cwd, `./${key}.html`)
          if (!fs.existsSync(vHtml)) {
            needRemove.push(vHtml)
            await fsp.copyFile(path.resolve(cwd,`.${pageOption.template}`), vHtml)
          }
        }
        console.warn('NOTICE: This plugin cannot use in library mode!')
        // get custom distDir config,if it is undefined use default config 'dist'
        distDir = config.build?.outDir ?? 'dist'
        // inject build.rollupOptions.input from pages directly.
        config.build = {
          ...config.build,
          rollupOptions: {
            input: {
              ...extractHtmlPath(pages),
            },
          },
        }
      }
    },
    async load(id: string){
      if (id.endsWith('html')) {
        const newId = getHtmlName(id)
        const page = await generatePageOptions(pages[newId], globalData, globalRender)
        // generate html template
        const otherHtmlBuffer = await readHtml(page)
        return otherHtmlBuffer
      }
      return null
    },
    async closeBundle() {
      // remove files should not be under project root
      for (let vHtml of needRemove) {
        if (fs.existsSync(vHtml)) {
          await fsp.rm(vHtml).catch(()=>{
            // ignore this warning
          })
        }
      }
    },
  }
}
