import fs from 'fs/promises'
import path from 'path'

import {Plugin, ViteDevServer} from 'vite'

export default (pages: { [key: string]: any }, indexPage: string): Plugin => {
  let outDir:string
  return {
    name: 'vite-plugin-virtual-html',
    config(config, {command}) {
      if (command === 'build') {
        // get custom outDir config,if it is undefined use default config 'dist'
        outDir = config.build?.outDir??'dist'
        // inject build.rollupOptions.input from pages directly.
        config.build = {
          ...config.build,
          rollupOptions: {
            input: {
              ...pages
            }
          }
        }
      }
    },
    configureServer(server: ViteDevServer) {
      server.middlewares.use(async (req, res, next) => {
        // if request is not html , directly return next()
        if (!req.url?.endsWith('.html') && req.url !== '/') {
          return next()
        }
        let url = req.url
        // if request / means it request indexPage page
        // read indexPage config ,and response indexPage page
        if (url === '/') {
          const htmlPath = pages[indexPage]
          res.end(await readHtml(htmlPath))
          return
        }
        // for html file, it is stored in each module,so now just response its' content
        const htmlName = url?.replace('/', '').replace('.html', '')
        const htmlPath = pages[htmlName]
        const html1 = await readHtml(htmlPath)
        res.end(html1)
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
        await fs.copyFile(src, dest)
        pathToRemove.push(pageArr[1])
      }
      // remove extra folder
      for (const toRemove of pathToRemove) {
        // catch rmdir's exception.
        // rmdir maybe remove a dir already remove.
        try {
          await fs.rmdir(path.resolve(process.cwd(), `./${outDir}/${toRemove}`), {recursive: true,})
        } catch (e){

        }
      }
    },
  }
}

async function readHtml(htmlPath: string) {
  return await fs.readFile(path.resolve(process.cwd(), `.${htmlPath}`))
}

