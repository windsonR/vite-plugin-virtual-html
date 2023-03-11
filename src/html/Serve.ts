import type {HtmlPluginOptions} from "./types"
import {Base} from "./Base"
import {buildHistoryApiFallback} from "../history-api/historyApiFallbackPlugin"
import type {ViteDevServer} from "vite"
import type {HistoryApiOptions, HistoryRewrites} from "../history-api/types"
import {normalizePath} from "./utils"

export class Serve extends Base {
  _rewrites?: Array<HistoryRewrites>

  constructor(virtualHtmlOptions: HtmlPluginOptions & HistoryApiOptions) {
    super(virtualHtmlOptions)
    this._rewrites = virtualHtmlOptions.rewrites
  }

  _configureServer = (server: ViteDevServer) => {
    if (this._rewrites) {
      buildHistoryApiFallback(server, this._rewrites)
    }
    // other html handled after vite's inner middlewares.
    return () => {
      server.middlewares.use('/', async (req, res, next) => {
        let url = decodeURI(this.generateUrl(req.url))
        // if request is not html , directly return next()
        if (!url.endsWith('.html') && url !== '/') {
          return next()
        }
        // if request / means it request indexPage htmlCode
        // read indexPage config ,and response indexPage htmlCode
        let htmlCode: string
        if (url === '/' || url.indexOf('index.html') >= 0) {
          url = `/${this._indexPage}.html`
          // @ts-ignore
          htmlCode = await this._load(normalizePath(url)) ?? ''
        } else {
          // @ts-ignore
          htmlCode = await this._load(url) ?? ''
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
