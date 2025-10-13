import type { HtmlPluginOptions } from './types'
import { VirtualHtmlPage, VirtualPageOptions } from './types'
import type { BuildEnvironmentOptions, UserConfig } from 'vite';
import { normalizePath } from 'vite'
import { Base } from './Base'
import fs, { promises as fsp } from 'fs'
import path from 'path'
interface Meta {
  rolldownVersion?:string;
}
export class Build extends Base {
  
  _needRemove: Array<string> = []
  _distDir!: string
  _meta:Meta
  
  constructor(virtualHtmlOptions: HtmlPluginOptions,meta:Meta) {
    super(virtualHtmlOptions)
    this._meta = meta
  }
  
  /**
   * check html file's parent directory
   * @param html
   * @param needRemove
   */
  async checkVirtualPath(html: string, needRemove: Array<string>, root: string) {
    const cwd = normalizePath(path.resolve(this.cwd, root))
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
    this._config = config
    const pagesKey = Object.keys(this._pages)
    for (let i = 0; i < pagesKey.length; i++) {
      const key = pagesKey[i]
      const pageOption = this._pages[key]
      const vHtml = normalizePath(path.resolve(this.cwd, `./${config.root ? this.addTrailingSlash(config.root) : ''}${this.htmlNameAddIndex(key)}.html`))
      if (!fs.existsSync(vHtml)) {
        this._needRemove.push(vHtml)
        await this.checkVirtualPath(vHtml, this._needRemove, config.root ?? '')
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
    let optionKey: keyof Pick<BuildEnvironmentOptions, 'rolldownOptions'|'rollupOptions'>= 'rollupOptions'
    // @ts-ignore
    if (this._meta.rolldownVersion) {
      optionKey = 'rolldownOptions'
    }
    config.build = {
      ...config.build,
      [optionKey]: {
        ...config.build?.[optionKey],
        input: {
          ...(config.build?.[optionKey]?.input as object),
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
  extractHtmlPath(pages: {
    [p: string]: VirtualHtmlPage | VirtualPageOptions
  }) {
    const newPages: {
      [key: string]: string
    } = {}
    Object.keys(pages).forEach(key => {
      newPages[key] = `/${this.htmlNameAddIndex(key)}.html`
    })
    return newPages
  }
  
  htmlNameAddIndex(htmlName: string): string {
    return htmlName.endsWith('/') ? htmlName + 'index' : htmlName
  }
  
}
