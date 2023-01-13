import glob from 'fast-glob'
import debug from 'debug'
import path from 'node:path'
import os from 'node:os'

export type PageObject = {
  template: string,
  data?: VirtualHtmlTemplateData,
  render?: VirtualHtmlTemplateRender,
}
/**
 * describe a page
 */
export type VirtualHtmlPage = string | PageObject | VirtualPageOptions
/**
 * html template render
 */
export type VirtualHtmlTemplateRender = (template: string, data: Record<string, any>) => string

export type VirtualHtmlTemplateData = Record<string, any>

export type Pages = { [key: string]: VirtualHtmlPage }

export type VirtualPageOptions = {
  entry: string,
  title?: string,
  body?: string,
}

/**
 * plugin config options
 */
export type PluginOptions = {
  /**
   * config html-entries' path
   * if it is true, plugin will use glob to find all the html page in project to generate a json like {a: /src/a/a.html,}
   */
  pages?: Pages | true,
  /**
   * define the index page,to replace default index.html
   * this page will trigger `transformIndexHtml` hook.
   */
  indexPage?: string,
  /**
   * use for template. as global inject data
   */
  data?: Record<string, unknown>
  /**
   * function to render template
   */
  render?: VirtualHtmlTemplateRender
  /**
   * when pages set to true, customize fast-glob's pattern
   * default value is ['**\\*.html', '!node_modules\\**\\*.html', '!.**\\*.html']
   */
  extraGlobPattern?: Array<string>
  /**
   * inject code to html
   * key: html name, can be *
   */
  injectCode?: Record<string, InjectCode>
}

/**
 * inject code to tag's before or after
 */
export enum POS {
  before,
  after
}

/**
 * inject code config
 */
export type InjectCode = {
  pos: POS,
  find: string,
  replacement: string,
}

export const DEFAULT_INJECTCODE_ALL = '*'

let alreadyShowEjsError = false

// noinspection JSUnusedLocalSymbols
export function defaultRender(template: string, data: Record<string, any>) {
  try {
    const resolved = require.resolve('ejs')
    return require(resolved).render(template, data, {
      delimiter: '%',
      root: process.cwd()
    })
  } catch (e) {
    // @ts-ignore
    if (e.code === 'MODULE_NOT_FOUND') {
      if (!alreadyShowEjsError) {
        logger(`[vite-plugin-virtual-html]: Module 'ejs' is not found! If you want to use it, please install it. Otherwise please ignore this error!`)
        alreadyShowEjsError = true
      }
    }
  }
  return template
}

export const cwd = normalizePath(process.cwd())

export const VIRTUAL_HTML_CONTENT = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>#TITLE#</title>
    <script src="#ENTRY#" type="module"></script>
</head>
<body>
#BODY#
</body>
</html>
`

const DEFAULT_GLOB_PATTERN = [
  '**/*.html',
  '!node_modules/**/*.html',
  '!.**/*.html'
]

export const logger = debug('vite-plugin-virtual-html')

/**
 * find all html file in project and return it as Pages
 */
export function findAllHtmlInProject(extraGlobPattern: Array<string> = []): Pages {
  const pages: Pages = {}
  let realPattern = extraGlobPattern
  if (extraGlobPattern.length === 0) {
    realPattern = DEFAULT_GLOB_PATTERN
  }
  const files = glob.sync(realPattern)
  files.forEach(file => {
    const filePathArr = file.split('/')
    pages[filePathArr[filePathArr.length - 1].replace('.html', '')] = `/${file}`
  })
  return pages
}

/**
 * directly use find\replacement / replacement\find to replace find
 * @param {pos, find, replacement}
 * @param code
 */
export function generateInjectCode({pos, find, replacement}: InjectCode, code: string): string {
  if (pos === POS.after) {
    return code.replace(find, `${find}\n${replacement}`)
  }
  if (pos === POS.before) {
    return code.replace(find, `\n${replacement}\n${find}`)
  }
  return code
}

/**
 * generate page from virtual page
 * @param vPages
 */
export async function generateVirtualPage(vPages: VirtualPageOptions): Promise<string> {
  const {
    entry,
    title = '',
    body= '<div id="app"></div>'
  } = vPages
  return VIRTUAL_HTML_CONTENT.replace('#ENTRY#', entry).replace('#TITLE#', title).replace('#BODY#',body)
}

// sourcecode from vite
// export const isWindows = os.platform() === 'win32'

export function slash(p: string): string {
  return p.replace(/\\/g, '/')
}
export function normalizePath(id: string): string {
  return path.posix.normalize(os.platform() === 'win32' ? slash(id) : id)
}
// end
