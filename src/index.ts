import fs, {promises as fsp} from 'fs'
import path from 'path'

import {Plugin, ViteDevServer} from 'vite'
import {TransformResult as TransformResult_2} from 'rollup'
import {Buffer} from 'buffer'

/**
 *
 */
type VirtualHtmlOptions = {
  /**
   * config html-entries' path
   */
  pages: { [key: string]: any },
  /**
   * define the index page,to replace default index.html
   * this page will trigger `transformIndexHtml` hook.
   */
  indexPage?: string,
}

export default (virtualHtmlOptions: VirtualHtmlOptions): Plugin => {
  const {pages, indexPage = 'index'} = virtualHtmlOptions
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
              ...pages,
            },
          },
        }
      }
    },
    configureServer(server: ViteDevServer) {
      server.middlewares.use(async (req, res, next) => {
        // if request is not html , directly return next()
        let url = generateUrl(req.url)
        if (!url.endsWith('.html') && url !== '/') {
          return next()
        }
        // if request / means it request indexPage page
        // read indexPage config ,and response indexPage page
        if (url === '/') {
          res.end(await readHtml(indexPage, pages))
          return
        }
        // for html file, it is stored in each module,so now just response its' content
        const htmlName = url?.replace('/', '').replace('.html', '')
        const otherHtmlBuffer = await readHtml(htmlName, pages)
        res.end(otherHtmlBuffer)
      })
    },
    async closeBundle() {
      const pageKeys = Object.keys(pages)
      const pathToRemove = []
      for (const pageKey of pageKeys) {
        // original build html path
        const src = path.resolve(process.cwd(), `./${outDir}/${pages[pageKey]}`)
        const pageArr = pages[pageKey].split('/')
        const pageName = pageArr[pageArr.length - 1]
        // dest html path
        const dest = path.resolve(process.cwd(), `./${outDir}/${pageName}`)
        await fsp.copyFile(src, dest)
        pathToRemove.push(pageArr[1])
      }
      // remove extra folder
      for (const toRemove of pathToRemove) {
        // catch rmdir's exception.
        // rmdir maybe remove a dir already remove.
        try {
          await fsp.rmdir(path.resolve(process.cwd(), `./${outDir}/${toRemove}`), {recursive: true})
        } catch (e) {

        }
      }
    },
    async transform(code: string, id: string, ssr?: boolean): Promise<TransformResult_2> {
      if (id.endsWith('html')) {
        return generateHtml(code, id)
      }
      return code
    },
  }
}

async function readHtml(htmlName: string, pages: { [key: string]: any }) {
  const htmlPath = pages[htmlName]
  const realHtmlPath = path.resolve(process.cwd(), `.${htmlPath}`)
  if (!fs.existsSync(realHtmlPath)) {
    const err = `${htmlName} page is not exists,please check your pages or indexPage configuration `
    console.error(err)
    return Buffer.from(err)
  }
  return await fsp.readFile(realHtmlPath).then(async (buffer) => {
    const htmlCode = await generateHtml(buffer.toString(), realHtmlPath)
    return Buffer.from(htmlCode)
  })
}

/**
 * add module script import
 * @param code
 * @param htmlPath
 */
async function generateHtml(code: string, htmlPath: string): Promise<string> {
  const viteScriptSrcRegex = /src=['"]\/.*\.(js|ts)['"]/
  // is the html code contains src='/a/b/c.js' or src='/a/b/c.ts',if it contains ,then return code directly
  // it means, the html code has the vite's js entry.
  // otherwise, auto inject the js/ts file near by the html file, and use the html's name
  if ( viteScriptSrcRegex.test(code)) {
    return code
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
  realEntryPath = realEntryPath.replace(/\\/g,'/')
  const basePath = path.resolve(process.cwd())
  const insertModuleScript = `
  <script type="module" src="${realEntryPath.replace(basePath, '')}"></script>
  </head>
  `
  return code.replace('</head>', insertModuleScript)
}

function generateUrl(url?:string):string{
  if (!url) {
    return '/'
  }
  // url with parameters
  if (url.indexOf('?') > 0) {
    return url.split('?')[0]
  }
  return url
}
