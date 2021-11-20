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
/**
 * plugin config options
 */
export type PluginOptions = {
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
   * use for template. as global inject data
   */
  data?: Record<string, unknown>
  /**
   * function to render template
   */
  render?: VirtualHtmlTemplateRender
}

export function defaultRender(template: string, data: Record<string, any>){
  return template
}

export const cwd = process.cwd().replaceAll('\\', '/')
