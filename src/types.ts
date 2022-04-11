import { normalizePath } from 'vite'

export type PageObject = {
  template: string,
  data?: VirtualHtmlTemplateData,
  render?: VirtualHtmlTemplateRender,
}
/**
 * describe a page
 */
export type VirtualHtmlPage = string | PageObject
/**
 * html template render
 */
export type VirtualHtmlTemplateRender = (template: string, data: Record<string, any>) => string

export type VirtualHtmlTemplateData = Record<string, any>

export type Pages = { [key: string]: VirtualHtmlPage }
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
}

// noinspection JSUnusedLocalSymbols
export function defaultRender(template: string, data: Record<string, any>){
  return template
}

export const cwd = normalizePath(process.cwd())
