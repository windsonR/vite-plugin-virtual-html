// noinspection UnnecessaryLocalVariableJS
import {normalizePath, Plugin, UserConfig, ViteDevServer} from 'vite'
import {cwd, Pages, PluginOptions} from './types'
import {generatePageOptions, generateUrl, readHtml} from './devUtils'
import {addTrailingSlash, extractHtmlPath, getHtmlName} from './buildUtils'
import path from 'path'
import fs, {promises as fsp} from 'fs'
import {findAllHtmlInProject} from './utils'

export default (virtualHtmlOptions: PluginOptions): Plugin => {
  const {
    pages: pagesObj,
    indexPage = 'index',
    render: globalRender = (template: string) => template,
    data: globalData = {},
  } = virtualHtmlOptions
  let pages: Pages
  if (pagesObj === true || pagesObj === undefined) {
    pages = findAllHtmlInProject()
  } else {
    pages = pagesObj
  }
  let _config: UserConfig;
  let distDir: string
  const needRemove: Array<string> = []
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
          let page: string
          if (url === '/' || url.indexOf('index.html') >= 0) {
            // @ts-ignore
            page = await this.load(normalizePath(`/${indexPage}.html`)) ?? ''
          } else {
            // @ts-ignore
            page = await this.load(url) ?? ''
          }
          res.end(await server.transformIndexHtml(url, page))
        })
      }
    },
    async config(config, {command}) {
      _config = config;
      if (command === 'build') {
        const allPage = Object.entries(pages)
        // copy all html which is not under project root
        for (const [key, value] of allPage) {
          const pageOption = await generatePageOptions(value, globalData, globalRender)
          const vHtml = path.resolve(cwd, `./${config.root ? addTrailingSlash(config.root) : ''}${key}.html`)
          if (!fs.existsSync(vHtml)) {
            needRemove.push(vHtml)
            await fsp.copyFile(path.resolve(cwd, `.${pageOption.template}`), vHtml)
          }
        }
        console.warn('NOTICE: This plugin cannot use in library mode!')
        // get custom distDir config,if it is undefined use default config 'dist'
        distDir = config.build?.outDir ?? 'dist'
        // inject build.rollupOptions.input from pages directly.
        config.build = {
          ...config.build,
          rollupOptions: {
            ...config.build?.rollupOptions,
            input: {
              ...(config.build?.rollupOptions?.input as object),
              ...extractHtmlPath(pages),
            },
          },
        }
      }
    },
    async load(id: string) {
      if (id.endsWith('html')) {
        const newId = getHtmlName(id, _config?.root)
        const page = await generatePageOptions(pages[newId], globalData, globalRender)
        // generate html template
        return await readHtml(page)
      }
      return null
    },
    async closeBundle() {
      // remove files should not be under project root
      for (let vHtml of needRemove) {
        if (fs.existsSync(vHtml)) {
          await fsp.rm(vHtml).catch(() => {
            // ignore this warning
          })
        }
      }
    },
  }
}
