import type {HtmlPluginOptions} from "./types"
import {VirtualHtmlPage, VirtualPageOptions} from "./types"
import type {UserConfig} from 'vite'
import {Base} from "./Base"
import fs, {promises as fsp} from "fs"
import path from "path"
import {normalizePath} from "./utils"

export class Build extends Base {

  _needRemove: Array<string> = []
  _distDir!: string

  constructor(virtualHtmlOptions: HtmlPluginOptions) {
    super(virtualHtmlOptions)
  }

  /**
   * check html file's parent directory
   * @param html
   * @param needRemove
   */
  async checkVirtualPath(html: string, needRemove: Array<string>, root: string) {
    const cwd = path.resolve(this.cwd, root)
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

  async _buildConfig(config: UserConfig,) {
    const pagesKey = Object.keys(this._pages)
    for (let i = 0; i < pagesKey.length; i++) {
      const key = pagesKey[i]
      const pageOption = this._pages[key]
      const vHtml = normalizePath(path.resolve(this.cwd, `./${config.root ? this.addTrailingSlash(config.root) : ''}${this.htmlNameAddIndex(key)}.html`))
      if (!fs.existsSync(vHtml)) {
        this._needRemove.push(vHtml)
        await this.checkVirtualPath(vHtml, this._needRemove, config.root)
        if (typeof pageOption === 'string' || 'template' in pageOption) {
          const genPageOption = await this.generatePageOptions(pageOption, this._globalData, this._globalRender)
          await fsp.copyFile(path.resolve(this.cwd, `.${genPageOption.template}`), vHtml)
        }
        if (typeof pageOption !== 'string' && 'entry' in pageOption) {
          await fsp.writeFile(path.resolve(this.cwd, vHtml), await this.generateVirtualPage(pageOption))
        }
      }
    }
    this.logger('[vite-plugin-virtual-html]: This plugin cannot use in library mode!')
    // get custom distDir config,if it is undefined use default config 'dist'
    this._distDir = config.build?.outDir ?? 'dist'
    // inject build.rollupOptions.input from pages directly.
    config.build = {
      ...config.build,
      rollupOptions: {
        ...config.build?.rollupOptions,
        input: {
          ...(config.build?.rollupOptions?.input as object),
          ...this.extractHtmlPath(this._pages),
        },
      },
    }
  }

  _closeBundle() {
    // remove files should not be under project root
    for (let vHtml of this._needRemove) {
      if (fs.existsSync(vHtml)) {
        fsp.rm(vHtml, {
          recursive: true,
        }).catch(() => {
          // ignore this warning
        })
      }
    }
  }

  /**
   * use pages' key as html name
   * @param pages
   */
  extractHtmlPath(pages: { [p: string]: VirtualHtmlPage | VirtualPageOptions }) {
    const newPages: { [key: string]: string } = {}
    Object.keys(pages).forEach(key => {
      newPages[key] = `/${this.htmlNameAddIndex(key)}.html`
    })
    return newPages
  }

  htmlNameAddIndex(htmlName: string): string{
    return htmlName.endsWith('/') ? htmlName + 'index' : htmlName
  }

}
