import { type IncomingMessage } from 'http'

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
export type VirtualHtmlTemplateRender = (template: string, data: Record<string, any>, htmlName?: string) => string

export type VirtualHtmlTemplateData = Record<string, any>

export type Pages = {
  [key: string]: VirtualHtmlPage
}

export type VirtualPageOptions = {
  entry: string,
  title?: string,
  body?: string,
}

export type UrlTransformerFunction = (resolvedUrl: string, req: IncomingMessage) => string

/**
 * plugin config options
 */
export type HtmlPluginOptions = {
  /**
   * config html-entries' path
   * if it is true, plugin will use glob to find all the html page in project to generate a json like {a: /src/a/a.html,}
   */
  pages?: Pages | true,
  /**
   * transform url to another url by user.
   * This is ONLY apply in dev mode.
   * @param url
   */
  urlTransformer?: UrlTransformerFunction
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
  /**
   * is set appType to custom?
   */
  useCustom?: boolean
  cwd?: string
}

/**
 * inject code to tag's before or after
 */
export enum POS {
  before, after
}

/**
 * inject code config
 */
export type InjectCode = {
  pos: POS,
  find: string,
  replacement: string,
}
