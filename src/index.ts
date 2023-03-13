import type {Plugin,} from 'vite'
import type {HtmlPluginOptions,} from './html/types'
import virtualHtmlPlugin from "./html/VirtualHtmlPlugin"
import type {HistoryApiOptions} from "./history-api/types"

export default (virtualHtmlOptions: HtmlPluginOptions & HistoryApiOptions): Plugin => {
  return new virtualHtmlPlugin(virtualHtmlOptions)
}

export * from './history-api/historyApiFallbackPlugin'

export * from './html/types'

export * from './history-api/types'
