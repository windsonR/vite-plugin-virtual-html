// noinspection UnnecessaryLocalVariableJS,JSUnusedGlobalSymbols
// noinspection JSUnusedGlobalSymbols

import type { Plugin, UserConfig, ViteDevServer } from 'vite'
import {
  cwd,
  DEFAULT_INJECTCODE_ALL,
  defaultRender,
  Pages,
  PluginOptions,
  VirtualHtmlPage,
  VirtualPageOptions,
} from './types'
import { generatePageOptions, generateUrl, readHtml } from './devUtils'
import { addTrailingSlash, extractHtmlPath, getHtmlName } from './buildUtils'
import path from 'path'
import fs, { promises as fsp } from 'fs'
import { findAllHtmlInProject, generateInjectCode, generateVirtualPage, logger, normalizePath, } from './types'

export default (virtualHtmlOptions: PluginOptions): Plugin => {
  const {
    pages: pagesObj,
    indexPage = 'index',
    render: globalRender = defaultRender,
    data: globalData = {},
    extraGlobPattern = [],
    injectCode = {}
  } = virtualHtmlOptions
  let pages: Pages
  if (pagesObj === true || pagesObj === undefined) {
    pages = findAllHtmlInProject(extraGlobPattern)
  } else {
    pages = pagesObj
  }
  let _config: UserConfig
  let distDir: string
  const needRemove: Array<string> = []
  const plugin = {
    name: 'vite-plugin-virtual-html',
    configureServer(server: ViteDevServer) {
      // other html handled after vite's inner middlewares.
      return () => {
        server.middlewares.use('/', async (req, res, next) => {
          let url = decodeURI(generateUrl(req.url))
          // if request is not html , directly return next()
          if (!url.endsWith('.html') && url !== '/') {
            return next()
          }
          // if request / means it request indexPage htmlCode
          // read indexPage config ,and response indexPage htmlCode
          let htmlCode: string
          if (url === '/' || url.indexOf('index.html') >= 0) {
            url = `/${indexPage}.html`
            // @ts-ignore
            htmlCode = await plugin.load(normalizePath(url)) ?? ''
          } else {
            // @ts-ignore
            htmlCode = await plugin.load(url) ?? ''
          }
          // @ts-ignore
          res.end(await server.transformIndexHtml(url, await plugin.transform(htmlCode, url)))
          next()
        })
      }
    },
    async transform(code: string, id: string): Promise<string|null> {
      if (id.indexOf('.html') >= 0) {
        const ids = id.split('/')
        const key = ids[ids.length - 1]
        if (key in injectCode) {
          return generateInjectCode(injectCode[key], code)
        }
        if (DEFAULT_INJECTCODE_ALL in injectCode) {
          return generateInjectCode(injectCode[DEFAULT_INJECTCODE_ALL], code)
        }
      }
      return null
    },
    // @ts-ignore
    async config(config, {command}) {
      _config = config
      if (command === 'build') {
        for (let i = 0; i < Object.keys(pages).length; i++){
          const key = Object.keys(pages)[i]
          const pageOption = pages[key]
          const vHtml = normalizePath(path.resolve(cwd, `./${config.root ? addTrailingSlash(config.root) : ''}${key}.html`))
          if (!fs.existsSync(vHtml)) {
            needRemove.push(vHtml)
            await checkVirtualPath(vHtml, needRemove)
            if (typeof pageOption === 'string' || 'template' in pageOption) {
              const genPageOption = await generatePageOptions(pageOption, globalData, globalRender)
              await fsp.copyFile(path.resolve(cwd, `.${genPageOption.template}`), vHtml)
            }
            if (typeof pageOption !== 'string' && 'entry' in pageOption) {
              await fsp.writeFile(path.resolve(cwd, vHtml), await generateVirtualPage(pageOption))
            }
          }
        }
          logger('[vite-plugin-virtual-html]: This plugin cannot use in library mode!')
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
        const pageOption: VirtualHtmlPage | VirtualPageOptions = pages[newId]
        if (pageOption !== undefined) {
          // string
          if (typeof pageOption === 'string') {
            const page = await generatePageOptions(pageOption, globalData, globalRender)
            // generate html template
            return await readHtml(page)
          }
          // PageObject
          if ('template' in pageOption) {
            const page = await generatePageOptions(pageOption, globalData, globalRender)
            // generate html template
            return await readHtml(page)
          }
          // VirtualPageOptions
          if ('entry' in pageOption) {
            return await generateVirtualPage(pageOption)
          }
        }
      }
      return null
    },
    async closeBundle() {
      // remove files should not be under project root
      for (let vHtml of needRemove) {
        if (fs.existsSync(vHtml)) {
          await fsp.rm(vHtml, {
            recursive: true,
          }).catch(() => {
            // ignore this warning
          })
        }
      }
    },
  }
  return plugin
}

/**
 * check html file's parent directory
 * @param html
 * @param needRemove
 */
async function checkVirtualPath(html: string, needRemove: Array<string>) {
  const pathArr = html.split('/')
  const fileName = pathArr[pathArr.length - 1]
  const middlePath = html.replace(fileName, '').replace(cwd, '')
  const firstPath = middlePath.split('/')[1]
  if (!fs.existsSync(middlePath)) {
    needRemove.push(normalizePath(path.resolve(cwd, `./${firstPath}`)))
    await fsp.mkdir(path.resolve(cwd, `./${middlePath}`), {
      recursive: true
    })
  }
}
