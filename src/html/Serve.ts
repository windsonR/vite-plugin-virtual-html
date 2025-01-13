import type { HtmlPluginOptions, UrlTransformerFunction } from './types'
import { Base } from './Base'
import { buildHistoryApiFallback } from '../history-api/historyApiFallbackPlugin'
import type { ViteDevServer } from 'vite'
import { normalizePath, createFilter, } from 'vite'
import type { HistoryApiOptions, HistoryRewrites } from '../history-api/types'

const HTML_INCLUDE = [/\.html$/,/\/$/]
const HTML_FILTER = createFilter(HTML_INCLUDE)

export class Serve extends Base {
  _rewrites?: Array<HistoryRewrites>
  
  _urlTransformer?: UrlTransformerFunction
  
  constructor(virtualHtmlOptions: HtmlPluginOptions & HistoryApiOptions) {
    super(virtualHtmlOptions)
    this._rewrites = virtualHtmlOptions.rewrites
    this._urlTransformer = virtualHtmlOptions.urlTransformer
  }
  
  _configureServer = (server: ViteDevServer) => {
    if (this._rewrites) {
      buildHistoryApiFallback(server, this._rewrites)
    }
    // other html handled after vite's inner middlewares.
    return () => {
      server.middlewares.use(async (req, res, next) => {
        const originalUrl = req.originalUrl
        const reqUrl = req.url
        let url = decodeURI(this.generateUrl(originalUrl?.endsWith('/') ? originalUrl : reqUrl))
        // allow user customize url transformer
        if (this._urlTransformer) {
          url = this._urlTransformer(url, req)
        }
        // if request is not html , directly return next()
        if (!HTML_FILTER(url) && url !== '/') {
          return next()
        }
        // request / means client requests an index page
        // load it with indexPage config
        let htmlCode: string|undefined
        if (url === '/' || url === '/index.html') {
          url = `/${this._indexPage}.html`
        }
        // load specify html file code
        // @ts-ignore
        htmlCode = await this._load(normalizePath(url))
        if (htmlCode === undefined) {
          res.statusCode = 404
          res.end()
          return next()
        }
        // @ts-ignore
        const transformResult = await this._transform(htmlCode, url)
        if (transformResult === null) {
          return next()
        }
        res.end(await server.transformIndexHtml(url, transformResult))
        next()
      })
    }
  }
}
