import fs from 'fs/promises'
import path from 'path'

import {ViteDevServer} from 'vite'

export default (pages:{[key:string]:any}) => {
  return {
    name: 'vite-plugin-virtual-html',
    configureServer(server: ViteDevServer) {
      server.middlewares.use(async (req, res, next) => {
        // 如果不是html则直接调用next
        if (!req.url?.endsWith('.html')) {
          return next()
        }
        // 对于html来说,html文件是存放在各个页面模块内的,所以此时需要直接响应相应的html内容
        const htmlName = req.url?.replace('/', '').replace('.html', '')
        const htmlPath = pages[htmlName]
        const html1 = await fs.readFile(path.resolve(process.cwd(),`.${htmlPath}`))
        res.end(html1)
      })
    },
    async closeBundle() {
      // 复制dist/src目录及其子目录下的所有html到dist目录下
      const fileList = await readFileList(path.resolve(process.cwd(), './dist/src'), [])
      for (let file of fileList) {
        const filePaths = file.split('/')
        await fs.copyFile(file, path.resolve(process.cwd(), `./dist/${filePaths[filePaths.length-1]}`))
      }
      await fs.rmdir(path.resolve(process.cwd(), './dist/src'), {recursive:true})
    },
  }
}

async function readFileList(src: string, filesList: Array<string>) {

  const files = await fs.readdir(src)
  for (let item of files) {
    const fullPath = path.join(src, item)
    const stat = await fs.stat(fullPath)
    if (stat.isDirectory()) {
      await readFileList(path.join(src, item), filesList) //递归读取文件
    } else {
      filesList.push(fullPath)
    }
  }
  return filesList
}

