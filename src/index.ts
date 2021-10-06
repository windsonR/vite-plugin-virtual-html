import fs, {promises as fsp} from 'fs'
import path from 'path'

import {Plugin, ViteDevServer} from 'vite'
import {TransformResult as TransformResult_2} from 'rollup'
import {Buffer} from 'buffer'

/**
 * describe a page
 */
type VirtualHtmlPage = string | { html: string, data?: Record<string, any> }
/**
 * html template render
 */
type VirtualHtmlTemplateRender = (template: string, data: Record<string, any>) => string
/**
 * plugin's options
 */
type VirtualHtmlOptions = {
  /**
   * config html-entries' path
   */
  pages: { [key: string]: VirtualHtmlPage },
  /**
   * define the index page,to replace default index.html
   * this page will trigger `transformIndexHtml` hook.
   */
  indexPage?: string,
  /**
   * function to render template
   */
  render?: VirtualHtmlTemplateRender
}

function extractHtmlPath(pages: { [p: string]: VirtualHtmlPage }) {
  const newPages: { [key: string]: string } = {}
  Object.keys(pages).forEach(key => {
    const page = pages[key]
    if (typeof page === 'string') {
      newPages[key] = page
    } else {
      newPages[key] = page.html
    }
  })
  return newPages
}

export default (virtualHtmlOptions: VirtualHtmlOptions): Plugin => {
  // noinspection JSUnusedLocalSymbols
  const {
    pages,
    indexPage = 'index',
    render = (template: string, data: Record<string, any>) => template
  } = virtualHtmlOptions
  let outDir: string
  return {
    name: 'vite-plugin-virtual-html',
    config(config, {command}) {
      if (command === 'build') {
        // get custom outDir config,if it is undefined use default config 'dist'
        outDir = config.build?.outDir ?? 'dist'
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
    configureServer(server: ViteDevServer) {
      // other html handled after vite's inner middlewares.
      return () => {
        server.middlewares.use('/', async (req, res, next) => {
          // if request is not html , directly return next()
          let url = generateUrl(req.url)
          if (!url.endsWith('.html') && url !== '/') {
            return next()
          }
          // if request / means it request indexPage page
          // read indexPage config ,and response indexPage page
          if (url === '/' || url.indexOf('index.html') >= 0) {
            res.end(await readHtml(indexPage, pages, render))
            return
          }
          // for html file, it is stored in each module,so now just response its' content
          const htmlName = url?.replace('/', '').replace('.html', '')
          const otherHtmlBuffer = await readHtml(htmlName, pages, render)
          res.end(otherHtmlBuffer)
        })
      }
    },
    async closeBundle() {
      const newPages = extractHtmlPath(pages)
      const pageKeys = Object.keys(newPages)
      const pathToRemove = []
      for (const pageKey of pageKeys) {
        // original build html path
        const src = path.resolve(process.cwd(), `${outDir}/${newPages[pageKey]}`)
        const pageArr = newPages[pageKey].split('/')
        const pageName = pageArr[pageArr.length - 1]
        // dest html path
        const dest = path.resolve(process.cwd(), `${outDir}/${pageName}`)
        if (fs.existsSync(src)) {
          await fsp.copyFile(src, dest)
          pathToRemove.push(pageArr[1])
        }
      }
      // remove extra folder
      for (const toRemove of pathToRemove) {
        // catch rmdir's exception.
        // rmdir maybe remove a dir already remove.
        if (fs.existsSync(`${outDir}/${toRemove}`)) {
          await fsp.rmdir(path.resolve(process.cwd(), `${outDir}/${toRemove}`), {recursive: true})
        }
      }
    },
    async transform(code: string, id: string): Promise<TransformResult_2> {
      if (id.endsWith('html')) {
        const fullPathArr = id.split('/')
        const htmlName = fullPathArr[fullPathArr.length - 1].replace('.html','')
        let data = {}
        if (typeof pages[htmlName] === 'string') {
          data = {}
        } else {
          // @ts-ignore
          data = pages[htmlName].data
        }
        return generateHtml(code, id, data, render)
      }
      return code
    },
  }
}

async function readHtml(htmlName: string, pages: { [key: string]: VirtualHtmlPage }, render: VirtualHtmlTemplateRender) {
  const newPages = extractHtmlPath(pages)
  const htmlPath = newPages[htmlName]
  const realHtmlPath = path.resolve(process.cwd(), `.${htmlPath}`)
  if (!fs.existsSync(realHtmlPath)) {
    const err = `${htmlName} page is not exists,please check your pages or indexPage configuration `
    console.error(err)
    return Buffer.from(err)
  }
  return await fsp.readFile(realHtmlPath).then(async (buffer) => {
    let data
    if (typeof pages[htmlName] === 'string') {
      data = {}
    } else {
      // @ts-ignore
      data = pages[htmlName].data
    }
    const htmlCode = await generateHtml(buffer.toString(), realHtmlPath, data, render)
    return Buffer.from(htmlCode)
  })
}

/**
 * add module script import
 * @param code
 * @param htmlPath
 * @param data
 * @param render
 */
async function generateHtml(code: string, htmlPath: string, data?: Record<string, any>, render?: VirtualHtmlTemplateRender): Promise<string> {
  const viteScriptSrcRegex = /src=['"]\/.*\.(js|ts)['"]/
  // is the html code contains src='/a/b/c.js' or src='/a/b/c.ts',if it contains ,then return code directly
  // it means, the html code has the vite's js entry.
  // otherwise, auto inject the js/ts file near by the html file, and use the html's name
  if (viteScriptSrcRegex.test(code)) {
    return renderTemplate(code, data, render)
  }
  const jsPath = path.resolve(htmlPath.replace('.html', '.js'))
  const tsPath = path.resolve(htmlPath.replace('.html', '.ts'))
  let realEntryPath: string = tsPath
  if (fs.existsSync(tsPath)) {
    realEntryPath = tsPath
  } else if (fs.existsSync(jsPath)) {
    realEntryPath = jsPath
  } else {
    console.error(`[vite-plugin-virtual-html]: There is no such ${jsPath} or ${tsPath} exists near by ${htmlPath}`)
    return `[vite-plugin-virtual-html]: There is no such ${jsPath} or ${tsPath} exists near by ${htmlPath}`
  }
  
  // fix: windows slash error
  realEntryPath = realEntryPath.replace(/\\/g, '/')
  const basePath = path.resolve(process.cwd())
  const insertModuleScript = `
  <script type="module" src="${realEntryPath.replace(basePath, '')}"></script>
  </head>
  `
  return renderTemplate(code.replace('</head>', insertModuleScript), data, render)
}

/**
 * use custom render function to render template
 * @param template
 * @param data
 * @param render
 */
function renderTemplate(template: string, data?: Record<string, any>, render?: VirtualHtmlTemplateRender) {
  if (render && data) {
    return render(template, data)
  }
  return template
}

function generateUrl(url?: string): string {
  if (!url) {
    return '/'
  }
  // url with parameters
  if (url.indexOf('?') > 0) {
    return url.split('?')[0]
  }
  return url
}
