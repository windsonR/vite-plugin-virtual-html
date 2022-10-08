import { normalizePath } from 'vite'

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
export function defaultRender(template: string, data: Record<string, any>){
  try {
    const resolved = require.resolve('ejs')
    return require(resolved).render(template, data, {delimiter: '%', root: process.cwd()})
  } catch (e){
    // @ts-ignore
    if (e.code === 'MODULE_NOT_FOUND') {
      if (!alreadyShowEjsError) {
        console.error(`Module 'ejs' is not found! If you want to use it, please install it. Otherwise please ignore this error!`);
        alreadyShowEjsError = true
      }
    }
  }
  return template
}

export const cwd = normalizePath(process.cwd())
