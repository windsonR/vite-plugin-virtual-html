import type {Plugin,} from 'vite'
import type {HtmlPluginOptions,} from './html/types'
import { VirtualHtmlPlugin } from "./html/VirtualHtmlPlugin"
import type {HistoryApiOptions} from "./history-api/types"

export default (virtualHtmlOptions: HtmlPluginOptions & HistoryApiOptions): Plugin => {
  return new VirtualHtmlPlugin(virtualHtmlOptions)
}

export {
  VirtualHtmlPlugin,
}

export * from './html/Build'

export * from './html/Serve'

export * from './history-api/historyApiFallbackPlugin'

export * from './html/types'

export * from './history-api/types'
